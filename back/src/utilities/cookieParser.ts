export const cookiesParser = (cookies: string): object | false => {

    cookies = `{ "${cookies}" }`
    cookies = cookies.replace(new RegExp('=', 'g'), '":"');
    cookies = cookies.replace(new RegExp('; ', 'g'), '", "');

    try {

        return JSON.parse(cookies);
    } catch {

        return false;
    }
}