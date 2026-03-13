package expo.modules.googlesignin

import android.content.Context
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import com.google.android.libraries.identity.googleid.GetGoogleIdTokenCredentialRequest
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class GoogleSignInModule : Module() {
    private var clientId: String? = null
    private var webClientId: String? = null
    private val scope = CoroutineScope(Dispatchers.Main)

    override fun definition() = ModuleDefinition {
        Name("GoogleSignIn")

        Function("configure") { config: Map<String, Any?> ->
            clientId = config["clientId"] as? String
                ?: throw CodedException("MISSING_CLIENT_ID", "clientId is required in the configuration", null)

            webClientId = config["webClientId"] as? String ?: clientId
        }

        AsyncFunction("signIn") { promise: Promise ->
            val serverClientId = webClientId ?: clientId
            if (serverClientId == null) {
                promise.reject(CodedException("NOT_CONFIGURED", "GoogleSignIn has not been configured. Call configure() first.", null))
                return@AsyncFunction
            }

            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("NO_ACTIVITY", "No current activity available", null))
                return@AsyncFunction
            }

            val credentialManager = CredentialManager.create(activity)

            val signInWithGoogleOption = GetSignInWithGoogleOption.Builder(serverClientId)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(signInWithGoogleOption)
                .build()

            scope.launch {
                try {
                    val result = credentialManager.getCredential(activity, request)
                    handleSignInResult(result, promise)
                } catch (e: Exception) {
                    promise.reject(CodedException("SIGN_IN_FAILED", "Sign-in failed: ${e.message}", e))
                }
            }
        }

        AsyncFunction("signInSilently") { promise: Promise ->
            val serverClientId = webClientId ?: clientId
            if (serverClientId == null) {
                promise.reject(CodedException("NOT_CONFIGURED", "GoogleSignIn has not been configured. Call configure() first.", null))
                return@AsyncFunction
            }

            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("NO_ACTIVITY", "No current activity available", null))
                return@AsyncFunction
            }

            val credentialManager = CredentialManager.create(activity)

            val googleIdOption = GetGoogleIdTokenCredentialRequest.Builder()
                .setFilterByAuthorizedAccounts(true)
                .setServerClientId(serverClientId)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            scope.launch {
                try {
                    val result = credentialManager.getCredential(activity, request)
                    handleSignInResult(result, promise)
                } catch (e: Exception) {
                    promise.reject(CodedException("SILENT_SIGN_IN_FAILED", "Silent sign-in failed: ${e.message}", e))
                }
            }
        }

        AsyncFunction("getTokens") { promise: Promise ->
            // On Android with Credential Manager, tokens are obtained during sign-in.
            // Re-trigger silent sign-in to get fresh tokens.
            val serverClientId = webClientId ?: clientId
            if (serverClientId == null) {
                promise.reject(CodedException("NOT_CONFIGURED", "GoogleSignIn has not been configured. Call configure() first.", null))
                return@AsyncFunction
            }

            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("NO_ACTIVITY", "No current activity available", null))
                return@AsyncFunction
            }

            val credentialManager = CredentialManager.create(activity)

            val googleIdOption = GetGoogleIdTokenCredentialRequest.Builder()
                .setFilterByAuthorizedAccounts(true)
                .setServerClientId(serverClientId)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            scope.launch {
                try {
                    val result = credentialManager.getCredential(activity, request)
                    handleSignInResult(result, promise)
                } catch (e: Exception) {
                    promise.reject(CodedException("GET_TOKENS_FAILED", "Failed to get tokens: ${e.message}", e))
                }
            }
        }

        AsyncFunction("signOut") { promise: Promise ->
            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("NO_ACTIVITY", "No current activity available", null))
                return@AsyncFunction
            }

            val credentialManager = CredentialManager.create(activity)

            scope.launch {
                try {
                    credentialManager.clearCredentialState(ClearCredentialStateRequest())
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject(CodedException("SIGN_OUT_FAILED", "Sign-out failed: ${e.message}", e))
                }
            }
        }
    }

    private fun handleSignInResult(result: GetCredentialResponse, promise: Promise) {
        val credential = result.credential

        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
            val response = mutableMapOf<String, Any?>(
                "idToken" to googleIdTokenCredential.idToken,
            )

            // Include server auth code if available (for server-side scope exchange)
            val serverAuthCode = credential.data.getString("com.google.android.libraries.identity.googleid.BUNDLE_KEY_SERVER_AUTH_CODE")
            if (serverAuthCode != null) {
                response["serverAuthCode"] = serverAuthCode
            }

            promise.resolve(response)
        } else {
            promise.reject(CodedException("UNEXPECTED_CREDENTIAL", "Received unexpected credential type", null))
        }
    }
}
