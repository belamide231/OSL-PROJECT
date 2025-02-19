import axios from "axios";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { Dropbox } from "dropbox";
dotenv.config();

import { dropbox, level } from "../app";

const renewAccessToken = async (): Promise<string> => {
    try {
        const response = await axios.post(
            "https://api.dropbox.com/oauth2/token",
            null,
            {
                params: {
                    refresh_token: process.env.DROPBOX_TOKEN,
                    grant_type: "refresh_token",
                    client_id: process.env.DROPBOX_KEY,
                    client_secret: process.env.DROPBOX_SECRET,
                },
            },
        );

        return response.data.access_token;
    } catch (error) {
        console.log(error);
        return "";
    }
};

let expiry = 0;
const duration = 1000 * 60 * 60 * 3 + 1000 * 60 * 50;

const observeDropbox = async () => {
    setTimeout(async () => {
        const token = await renewAccessToken();
        dropbox.connection = new Dropbox({ accessToken: token, fetch });
        await level.put("token", token);
        await level.put("expiry", (duration + Date.now()).toString());
        expiry = duration;
    }, expiry);
};

export const refresher = async () => {
    const data = (await level.getMany(["token", "expiry"])) as any;

    if (!data[0] || !data[1] || isNaN(data[1]) || parseInt(data[1]) < Date.now()) {
        const token = await renewAccessToken();
        dropbox.connection = new Dropbox({ accessToken: token, fetch });
        await level.put("token", token);
        await level.put("expiry", (duration + Date.now()).toString());
        expiry = duration;
    } else {
        dropbox.connection = new Dropbox({ accessToken: data[0], fetch });
        expiry = parseInt(data[1]) - Date.now();
    }

    observeDropbox();
};
