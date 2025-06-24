export const LAST_REGION_KEY = "lastVisitedRegion";
export const LAST_REGION_ID_KEY = "lastVisitedRegionId";

export const getLastRegion = () => {
    const lastRegion = localStorage.getItem(LAST_REGION_KEY);
    return lastRegion ? JSON.parse(lastRegion) : null;
};
