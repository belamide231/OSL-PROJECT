import { dns } from "../environment/dns";


export class APIConfiguration {

    public static endpoint = (endpoint: string) => {
        return `${dns}${endpoint}`;
    }

    public static headers = () => {
        return { 
            headers: { 
                'Content-Type': 'application/json' 
            }, 
            withCredentials: true, 
            observe: 'response' as 'response', 
            responseType: 'text' as 'json' 
        };
    }

}