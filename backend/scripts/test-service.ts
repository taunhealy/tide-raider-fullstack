import { getLatestConditions } from "../src/services/surfConditionsService";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Testing forecast service for western-cape (WINDFINDER)...");
        const forecast = await getLatestConditions("western-cape", true, "WINDFINDER");
        console.log("Forecast result:", JSON.stringify(forecast, null, 2));
    } catch (e: any) {
        console.error("Service failed:", e.message);
        console.error(e.stack);
    }
}

main();
