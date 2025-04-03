export class ApiConfiguration {

    public static header = { 
        headers: { 
            'Content-Type': 'application/json' 
        }, 
        withCredentials: true, 
        observe: 'response' as 'response', 
        responseType: 'text' as 'json' 
    };

    public static routes = (endpoint: string) => {
        return endpoint;
    }
}