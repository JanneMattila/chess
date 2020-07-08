import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "../reducers";
import { loginEvent, ProcessState } from "../actions";
import { UserAgentApplication, Configuration } from "msal";
import { Link, useHistory, useLocation } from "react-router-dom";
import { getAppInsights } from "./TelemetryService";
import "./Auth.css";
import { Database, DatabaseFields } from "../data/Database";

type AuthProps = {
    clientId: string;
    applicationIdURI: string;
    endpoint: string;
};

let userAgentApplication: UserAgentApplication;

export function Auth(props: AuthProps) {
    const location = useLocation();
    const history = useHistory();

    const loginState = useTypedSelector(state => state.loginState);
    const account = useTypedSelector(state => state.account);

    const dispatch = useDispatch();
    const ai = getAppInsights();

    const accessTokenRequest = {
        scopes: [
            props.applicationIdURI + "/User.ReadWrite",
            props.applicationIdURI + "/Games.ReadWrite"
        ]
    };

    const config: Configuration = {
        auth: {
            clientId: props.clientId,
            authority: "https://login.microsoftonline.com/common",
            navigateToLoginRequestUrl: false,
            redirectUri: window.location.origin,
            postLogoutRedirectUri: window.location.origin
        },
        cache: {
            cacheLocation: "localStorage",
            storeAuthStateInCookie: true
        },
        system: {
            navigateFrameWait: 0
        }
    };

    const preAuthEvent = () => {
        if (location.pathname !== "/") {
            Database.set(DatabaseFields.AUTH_REDIRECT, location.pathname);
        }
    }

    const authEvent = (accessToken: string) => {
        const loggedInAccount = userAgentApplication.getAccount();
        if (loggedInAccount) {
            dispatch(loginEvent(ProcessState.Success, "" /* Clear error message */, loggedInAccount, accessToken));
        }
        postAuthEvent();
    }

    const postAuthEvent = () => {
        const redirectUrl = Database.get<string>(DatabaseFields.AUTH_REDIRECT);
        Database.delete(DatabaseFields.AUTH_REDIRECT);
        if (redirectUrl) {
            history.push(redirectUrl);
        }
    }

    const acquireTokenSilent = () => {
        userAgentApplication.acquireTokenSilent(accessTokenRequest).then(function (accessTokenResponse) {
            // Acquire token silent success
            authEvent(accessTokenResponse.accessToken);
        }).catch(function (error) {
            // Acquire token silent failure, wait for user sign in
            Database.clear();
        });
    }

    useEffect(() => {
        if (!userAgentApplication) {
            userAgentApplication = new UserAgentApplication(config);
            userAgentApplication.handleRedirectCallback((error, response) => {
                if (error) {
                    console.log("Auth error");
                    console.log(error);
                    const errorMessage = error.errorMessage ? error.errorMessage : "Unable to acquire access token.";
                    dispatch(loginEvent(ProcessState.Error, errorMessage));
                }
                else if (response) {
                    // Acquire token after login
                    authEvent(response.accessToken);
                }
            });

            acquireTokenSilent();
            setInterval(() => {
                acquireTokenSilent();
            }, 1000 * 60 * 45);
        }
    });

    const onSignIn = () => {
        Database.clear();
        preAuthEvent();
        return userAgentApplication.loginRedirect(accessTokenRequest);
    }

    const onSignOut = () => {
        Database.clear()
        userAgentApplication.logout();
    }

    if (loginState === ProcessState.Success) {
        return (
            <div className="Auth">
                <Link to="/settings" className="Auth-link">{account?.name}</Link>
                <button onClick={onSignOut} className="Auth-button">Sign out</button>
            </div>
        );
    }
    return (
        <div className="Auth">
            Want to play? Please
            <button onClick={onSignIn} className="Auth-button">sign In</button>
        </div>
    );
}
