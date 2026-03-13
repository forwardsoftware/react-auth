import ExpoModulesCore
import GoogleSignIn

public class GoogleSignInModule: Module {
  private var clientId: String?
  private var additionalScopes: [String] = []

  public func definition() -> ModuleDefinition {
    Name("GoogleSignIn")

    Function("configure") { (config: [String: Any]) in
      guard let clientId = config["clientId"] as? String else {
        throw GoogleSignInError.missingClientId
      }

      self.clientId = clientId

      let gidConfig = GIDConfiguration(clientID: clientId, serverClientID: config["webClientId"] as? String)
      GIDSignIn.sharedInstance.configuration = gidConfig

      if let scopes = config["scopes"] as? [String], !scopes.isEmpty {
        self.additionalScopes = scopes
      }
    }

    AsyncFunction("signIn") { (promise: Promise) in
      guard let clientId = self.clientId else {
        promise.reject(GoogleSignInError.notConfigured)
        return
      }

      guard let presentingViewController = self.getPresentingViewController() else {
        promise.reject(GoogleSignInError.noPresentingViewController)
        return
      }

      let scopes = self.additionalScopes
      GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController, hint: nil, additionalScopes: scopes) { signInResult, error in
        if let error = error {
          promise.reject(GoogleSignInError.signInFailed(error.localizedDescription))
          return
        }

        guard let result = signInResult else {
          promise.reject(GoogleSignInError.signInFailed("No result returned"))
          return
        }

        let user = result.user

        var response: [String: Any] = [:]

        if let idToken = user.idToken?.tokenString {
          response["idToken"] = idToken
        }

        response["accessToken"] = user.accessToken.tokenString

        if let serverAuthCode = result.serverAuthCode {
          response["serverAuthCode"] = serverAuthCode
        }

        promise.resolve(response)
      }
    }

    AsyncFunction("signInSilently") { (promise: Promise) in
      GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
        if let error = error {
          promise.reject(GoogleSignInError.signInFailed(error.localizedDescription))
          return
        }

        guard let user = user else {
          promise.reject(GoogleSignInError.signInFailed("No previous sign-in found"))
          return
        }

        var response: [String: Any] = [:]

        if let idToken = user.idToken?.tokenString {
          response["idToken"] = idToken
        }

        response["accessToken"] = user.accessToken.tokenString

        promise.resolve(response)
      }
    }

    AsyncFunction("getTokens") { (promise: Promise) in
      guard let user = GIDSignIn.sharedInstance.currentUser else {
        promise.reject(GoogleSignInError.notSignedIn)
        return
      }

      user.refreshTokensIfNeeded { user, error in
        if let error = error {
          promise.reject(GoogleSignInError.tokenRefreshFailed(error.localizedDescription))
          return
        }

        guard let user = user else {
          promise.reject(GoogleSignInError.tokenRefreshFailed("No user returned after refresh"))
          return
        }

        var response: [String: Any] = [:]

        if let idToken = user.idToken?.tokenString {
          response["idToken"] = idToken
        }

        response["accessToken"] = user.accessToken.tokenString

        promise.resolve(response)
      }
    }

    AsyncFunction("signOut") { (promise: Promise) in
      GIDSignIn.sharedInstance.signOut()
      promise.resolve(nil)
    }
  }

  private func getPresentingViewController() -> UIViewController? {
    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let window = scene.windows.first(where: { $0.isKeyWindow }),
          let rootViewController = window.rootViewController else {
      return nil
    }

    var topController = rootViewController
    while let presented = topController.presentedViewController {
      topController = presented
    }

    return topController
  }
}

enum GoogleSignInError: Error, CustomStringConvertible {
  case missingClientId
  case notConfigured
  case noPresentingViewController
  case notSignedIn
  case signInFailed(String)
  case tokenRefreshFailed(String)

  var description: String {
    switch self {
    case .missingClientId:
      return "clientId is required in the configuration"
    case .notConfigured:
      return "GoogleSignIn has not been configured. Call configure() first."
    case .noPresentingViewController:
      return "Could not find a presenting view controller"
    case .notSignedIn:
      return "No user is currently signed in"
    case .signInFailed(let message):
      return "Sign-in failed: \(message)"
    case .tokenRefreshFailed(let message):
      return "Token refresh failed: \(message)"
    }
  }
}
