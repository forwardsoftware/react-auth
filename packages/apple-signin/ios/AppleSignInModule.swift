import ExpoModulesCore
import AuthenticationServices
import CryptoKit

public class AppleSignInModule: Module {
  private var scopes: [ASAuthorization.Scope] = []
  private var rawNonce: String?

  public func definition() -> ModuleDefinition {
    Name("AppleSignIn")

    Function("configure") { (config: [String: Any]) in
      self.scopes = []

      if let scopeStrings = config["scopes"] as? [String] {
        for scope in scopeStrings {
          switch scope {
          case "name":
            self.scopes.append(.fullName)
          case "email":
            self.scopes.append(.email)
          default:
            break
          }
        }
      }

      self.rawNonce = config["nonce"] as? String
    }

    AsyncFunction("signIn") { (promise: Promise) in
      guard let presentingViewController = self.getPresentingViewController() else {
        promise.reject(AppleSignInError.noPresentingViewController)
        return
      }

      let provider = ASAuthorizationAppleIDProvider()
      let request = provider.createRequest()
      request.requestedScopes = self.scopes

      if let nonce = self.rawNonce {
        request.nonce = self.sha256(nonce)
      }

      let delegate = SignInDelegate(promise: promise, rawNonce: self.rawNonce)
      let controller = ASAuthorizationController(authorizationRequests: [request])
      controller.delegate = delegate
      controller.presentationContextProvider = PresentationContextProvider(window: presentingViewController.view.window)

      // Prevent delegate from being deallocated during async flow
      objc_setAssociatedObject(controller, "delegate", delegate, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

      controller.performRequests()
    }

    AsyncFunction("getCredentialState") { (userID: String, promise: Promise) in
      let provider = ASAuthorizationAppleIDProvider()
      provider.getCredentialState(forUserID: userID) { state, error in
        if let error = error {
          promise.reject(AppleSignInError.credentialStateFailed(error.localizedDescription))
          return
        }

        switch state {
        case .authorized:
          promise.resolve("authorized")
        case .revoked:
          promise.resolve("revoked")
        case .notFound:
          promise.resolve("notFound")
        case .transferred:
          promise.resolve("transferred")
        @unknown default:
          promise.resolve("notFound")
        }
      }
    }

    AsyncFunction("signOut") { (promise: Promise) in
      // Apple has no sign-out API; clearing is handled on the JS side
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

  private func sha256(_ input: String) -> String {
    let inputData = Data(input.utf8)
    let hashed = SHA256.hash(data: inputData)
    return hashed.compactMap { String(format: "%02x", $0) }.joined()
  }
}

private class SignInDelegate: NSObject, ASAuthorizationControllerDelegate {
  private let promise: Promise
  private let rawNonce: String?

  init(promise: Promise, rawNonce: String?) {
    self.promise = promise
    self.rawNonce = rawNonce
    super.init()
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
      promise.reject(AppleSignInError.signInFailed("Unexpected credential type"))
      return
    }

    var response: [String: Any] = [:]

    if let identityTokenData = credential.identityToken,
       let identityToken = String(data: identityTokenData, encoding: .utf8) {
      response["identityToken"] = identityToken
    } else {
      promise.reject(AppleSignInError.signInFailed("No identity token returned"))
      return
    }

    if let authCodeData = credential.authorizationCode,
       let authorizationCode = String(data: authCodeData, encoding: .utf8) {
      response["authorizationCode"] = authorizationCode
    }

    response["user"] = credential.user

    if let email = credential.email {
      response["email"] = email
    }

    if let fullName = credential.fullName {
      var nameDict: [String: String] = [:]
      if let givenName = fullName.givenName { nameDict["givenName"] = givenName }
      if let familyName = fullName.familyName { nameDict["familyName"] = familyName }
      if let middleName = fullName.middleName { nameDict["middleName"] = middleName }
      if let namePrefix = fullName.namePrefix { nameDict["namePrefix"] = namePrefix }
      if let nameSuffix = fullName.nameSuffix { nameDict["nameSuffix"] = nameSuffix }
      if let nickname = fullName.nickname { nameDict["nickname"] = nickname }
      if !nameDict.isEmpty {
        response["fullName"] = nameDict
      }
    }

    promise.resolve(response)
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    let authError = error as? ASAuthorizationError
    if authError?.code == .canceled {
      promise.reject(AppleSignInError.cancelled)
    } else {
      promise.reject(AppleSignInError.signInFailed(error.localizedDescription))
    }
  }
}

private class PresentationContextProvider: NSObject, ASAuthorizationControllerPresentationContextProviding {
  private let window: UIWindow?

  init(window: UIWindow?) {
    self.window = window
    super.init()
  }

  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    return window ?? ASPresentationAnchor()
  }
}

enum AppleSignInError: Error, CustomStringConvertible {
  case noPresentingViewController
  case signInFailed(String)
  case cancelled
  case credentialStateFailed(String)

  var description: String {
    switch self {
    case .noPresentingViewController:
      return "Could not find a presenting view controller"
    case .signInFailed(let message):
      return "Sign-in failed: \(message)"
    case .cancelled:
      return "Sign-in was cancelled by the user"
    case .credentialStateFailed(let message):
      return "Credential state check failed: \(message)"
    }
  }
}
