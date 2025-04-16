export function ThemeInitiator(ThemeInformation: {
    '--accent-color': string,
    '--primary-color': string, 
    '--secondary-color': string,
    '--whites-color': string 
}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const KeyColors = Object.keys(ThemeInformation);
        KeyColors.forEach(Key => document.documentElement.style.setProperty(Key, ThemeInformation[Key as keyof typeof ThemeInformation])); 
        const Initiated = KeyColors.map(Key => getComputedStyle(document.documentElement).getPropertyValue(Key) ? true : false);
        return resolve(Initiated.every(Element => Element === true));
    })
}