import API from "./API.js";
import Router from "./Router.js";

const Auth = {
    account: null,
    isLoggedIn: false,
    loginStep: 1,
    addWebAuthn: async () => {
        const options = await API.webAuthn.registrationOptions();
        options.authenticatorSelection.residentKey = 'required';
        options.authenticatorSelection.requireResidentKey = true;
        options.extensions = {
            credProps: true,
        };
        const authRes = await SimpleWebAuthnBrowser.startRegistration(options);
        const verificationRes = await API.webAuthn.registrationVerification(authRes);
        if (verificationRes.ok) {
            alert("You can now login using the registered method!");
        } else {
            alert(verificationRes.message)
        }
    },
    autoLogin: async () => {
        if (window.PasswordCredential) {
            const credentials = await navigator.credentials.get({ password: true });
            try {
                document.getElementById("login_email").value = credentials.id;
                document.getElementById("login_password").value = credentials.password;
                Auth.login();
            } catch (e) {}
        }
    },
    checkAuthOptions: async (event) => {
        const response = await API.checkAuthOptions({
            email: document.getElementById("login_email").value
        });
        if (response.password) {
            document.getElementById("login_section_password").hidden = false;
        }
        if (response.webauthn) {
            document.getElementById("login_section_webauthn").hidden = false;
        }
        Auth.challenge = response.challenge;
        Auth.loginStep = 2;
    },
    login: async (event) => {
        if (event) event.preventDefault();
        if (Auth.loginStep==1) {
            Auth.checkAuthOptions();
        } else {
            const user = {
                email: document.getElementById("login_email").value,
                password: document.getElementById("login_password").value

            };
            const response = await API.login(user);
            Auth.postLogin(response, {
                ...user,
                name: response.name
            });
        }
    },
    loginFromGoogle: async (data) => {
        const response = await API.loginFromGoogle(data)
        Auth.postLogin(response, {
            name: response.name,
            email: response.email
        });
    },
    logout: () => {
        Auth.isLoggedIn = false;
        Auth.account = null;
        Auth.updateStatus();
        Router.go("/");
        if (window.PasswordCredential) {
            navigator.credentials.preventSilentAccess()
        }
    },
    postLogin: (response, user) => {
        if (response.ok) {
            Auth.isLoggedIn = true;
            Auth.account = user;
            Auth.updateStatus();

            Router.go("/account");

            // Credential Management API
            if (window.PasswordCredential && user.password) {
                const credential = new PasswordCredential({
                    name: user.name,
                    id: user.email,
                    password: user.password
                });
                navigator.credentials.store(credential);
            }
        } else {
            alert(response.message)
        }
    },
    register: async  (event) => {
        event.preventDefault();
        const user = {
            name: document.getElementById("register_name").value,
            email: document.getElementById("register_email").value,
            password: document.getElementById("register_password").value
        }
        const response = await API.register(user);
        Auth.postLogin(response, user);
    },
    updateStatus() {
        if (Auth.isLoggedIn && Auth.account) {
            document.querySelectorAll(".logged_out").forEach(
                e => e.style.display = "none"
            );
            document.querySelectorAll(".logged_in").forEach(
                e => e.style.display = "block"
            );
            document.querySelectorAll(".account_name").forEach(
                e => e.innerHTML = Auth.account.name
            );
            document.querySelectorAll(".account_username").forEach(
                e => e.innerHTML = Auth.account.email
            );

        } else {
            document.querySelectorAll(".logged_out").forEach(
                e => e.style.display = "block"
            );
            document.querySelectorAll(".logged_in").forEach(
                e => e.style.display = "none"
            );

        }
    },
    init: () => {
        Auth.loginStep = 1;
        document.getElementById("login_section_password").hidden = true;
        document.getElementById("login_section_webauthn").hidden = true;
    },
}
Auth.updateStatus();

export default Auth;

// make it a global object
window.Auth = Auth;
