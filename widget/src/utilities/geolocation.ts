export async function GeoLocation(): Promise<{ city?: string, country?: string, street?: string }> {
  try {

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    });

    const { latitude, longitude } = position.coords;
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    const data = await response.json();

    return {
      city: data.address.city,
      country: data.address.country,
      street: data.address.road
    };
  } catch (error) {

    return {};
  } 
}