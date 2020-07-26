import React from "react";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "../reducers";
import { ProcessState, loginRequestedEvent } from "../actions";
import { Link } from "react-router-dom";
import "./Profile.css";

export function Profile() {
    const loginState = useTypedSelector(state => state.loginState);

    const dispatch = useDispatch();

    const onSignIn = () => {
        dispatch(loginRequestedEvent());
    }

    if (loginState === ProcessState.Success) {
        return (
            <div className="Profile">
                <Link to="/settings" className="Profile-link">Profile<span role="img" aria-label="Profile">&rarr;</span></Link>
            </div>
        );
    }
    return (
        <div className="Profile">
            Want to play? Please
            <button onClick={onSignIn} className="Profile-button">sign In</button>
        </div>
    );
}