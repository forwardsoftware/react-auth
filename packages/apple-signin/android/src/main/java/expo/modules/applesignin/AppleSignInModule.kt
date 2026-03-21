package expo.modules.applesignin

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Apple Sign-In on Android uses web-based OAuth via Custom Tabs.
 *
 * Apple's authorization endpoint uses response_mode=form_post, which means
 * the response is POSTed to your redirectUri. A backend intermediary is required
 * to convert this POST into a deep link redirect back to your app with the
 * id_token and authorization code as query parameters.
 */
class AppleSignInModule : Module() {
    private var clientId: String? = null
    private var redirectUri: String? = null
    private var scopes: List<String> = listOf("name", "email")
    private var nonce: String? = null
    private var state: String? = null
    private var pendingPromise: Promise? = null

    override fun definition() = ModuleDefinition {
        Name("AppleSignIn")

        Function("configure") { config: Map<String, Any?> ->
            clientId = config["clientId"] as? String
            redirectUri = config["redirectUri"] as? String
            scopes = (config["scopes"] as? List<*>)?.filterIsInstance<String>() ?: listOf("name", "email")
            nonce = config["nonce"] as? String
            state = config["state"] as? String
        }

        AsyncFunction("signIn") { promise: Promise ->
            val cid = clientId
            if (cid == null) {
                promise.reject(CodedException("NOT_CONFIGURED", "AppleSignIn has not been configured with a clientId. Call configure() first.", null))
                return@AsyncFunction
            }

            val redirect = redirectUri
            if (redirect == null) {
                promise.reject(CodedException("MISSING_REDIRECT_URI", "androidRedirectUri is required for Apple Sign-In on Android.", null))
                return@AsyncFunction
            }

            val activity = appContext.currentActivity
            if (activity == null) {
                promise.reject(CodedException("NO_ACTIVITY", "No current activity available", null))
                return@AsyncFunction
            }

            val scopeString = scopes.joinToString(" ")
            val uriBuilder = Uri.parse("https://appleid.apple.com/auth/authorize").buildUpon()
                .appendQueryParameter("client_id", cid)
                .appendQueryParameter("redirect_uri", redirect)
                .appendQueryParameter("response_type", "code id_token")
                .appendQueryParameter("response_mode", "form_post")
                .appendQueryParameter("scope", scopeString)

            nonce?.let { uriBuilder.appendQueryParameter("nonce", it) }
            state?.let { uriBuilder.appendQueryParameter("state", it) }

            pendingPromise = promise

            try {
                val customTabsIntent = CustomTabsIntent.Builder().build()
                customTabsIntent.launchUrl(activity, uriBuilder.build())
            } catch (e: Exception) {
                pendingPromise = null
                promise.reject(CodedException("SIGN_IN_FAILED", "Failed to launch Apple Sign-In: ${e.message}", e))
            }
        }

        /**
         * Called from your app's deep link handler after the backend redirects
         * with the Apple Sign-In response parameters.
         */
        Function("handleCallback") { params: Map<String, Any?> ->
            val promise = pendingPromise
            if (promise == null) {
                throw CodedException("NO_PENDING_SIGN_IN", "No pending sign-in to handle", null)
            }

            pendingPromise = null

            val identityToken = params["id_token"] as? String
            if (identityToken == null) {
                promise.reject(CodedException("MISSING_TOKEN", "No identity token in callback", null))
                return@Function
            }

            val response = mutableMapOf<String, Any?>(
                "identityToken" to identityToken,
            )

            val code = params["code"] as? String
            if (code != null) {
                response["authorizationCode"] = code
            }

            val user = params["user"] as? String
            if (user != null) {
                response["user"] = user
            }

            promise.resolve(response)
        }

        AsyncFunction("getCredentialState") { _: String, promise: Promise ->
            // Apple credential state is not available on Android
            promise.reject(CodedException("UNSUPPORTED", "getCredentialState is not supported on Android", null))
        }

        AsyncFunction("signOut") { promise: Promise ->
            // Apple has no sign-out API; clearing is handled on the JS side
            promise.resolve(null)
        }
    }
}
