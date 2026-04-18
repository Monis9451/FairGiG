import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ quiet: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TARGET_VERIFIED_EARNINGS = Number(
  process.env.SEED_VERIFIED_EARNINGS_COUNT || 1000
);
const BATCH_SIZE = 200;
const MIN_WORKERS = 80;

const CITY_ZONES = [
  "Lahore",
  "Gulberg",
  "Faisal Town",
  "Johar Town",
  "Saddar",
  "DHA",
  "Islamabad",
  "Rawalpindi",
];

const PLATFORMS = ["Uber", "FoodPanda", "Bykea", "inDrive"];

const roundTo = (value, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min, max, precision = 2) => {
  const value = Math.random() * (max - min) + min;
  return roundTo(value, precision);
};

const randomChoice = (items) => items[randomInt(0, items.length - 1)];

const randomDateWithinDays = (daysBack) => {
  const now = new Date();
  const randomOffsetDays = randomInt(0, daysBack);
  const randomDate = new Date(now);
  randomDate.setDate(now.getDate() - randomOffsetDays);
  return randomDate.toISOString().slice(0, 10);
};

const fetchWorkerProfiles = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, city_zone, role")
    .eq("role", "worker");

  if (error) {
    throw new Error(`Failed to fetch worker profiles: ${error.message}`);
  }

  return data || [];
};

const createWorkerProfiles = async (count) => {
  const seedBase = Date.now();

  const records = Array.from({ length: count }, (_, index) => ({
    full_name: `Seed Worker ${seedBase}-${index + 1}`,
    role: "worker",
    city_zone: randomChoice(CITY_ZONES),
  }));

  const { data, error } = await supabase
    .from("profiles")
    .insert(records)
    .select("id, full_name, city_zone, role");

  if (error) {
    throw new Error(`Failed to create worker profiles: ${error.message}`);
  }

  return data || [];
};

const buildVerifiedEarning = (workerProfile) => {
  const hoursWorked = randomFloat(4, 12, 2);
  const grossHourlyRate = randomFloat(280, 620, 2);
  const grossEarned = roundTo(hoursWorked * grossHourlyRate, 2);
  const deductionRate = randomFloat(0.15, 0.35, 4);
  const deductions = roundTo(grossEarned * deductionRate, 2);
  const netReceived = roundTo(grossEarned - deductions, 2);

  return {
    worker_id: workerProfile.id,
    platform: randomChoice(PLATFORMS),
    date: randomDateWithinDays(240),
    hours_worked: hoursWorked,
    gross_earned: grossEarned,
    deductions,
    net_received: netReceived,
    screenshot_url: null,
    status: "verified",
    anomaly_explanation: null,
  };
};

const insertInBatches = async (rows) => {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);

    const { error } = await supabase.from("earnings").insert(batch);

    if (error) {
      throw new Error(
        `Failed while inserting earnings batch at row ${start + 1}: ${error.message}`
      );
    }

    console.log(`Inserted ${Math.min(start + batch.length, rows.length)} / ${rows.length}`);
  }
};

const runSeeder = async () => {
  console.log("Starting verified earnings seeder...");

  let workers = await fetchWorkerProfiles();

  if (workers.length < MIN_WORKERS) {
    const missingCount = MIN_WORKERS - workers.length;
    console.log(`Creating ${missingCount} worker profiles for realistic distribution...`);

    const createdWorkers = await createWorkerProfiles(missingCount);
    workers = [...workers, ...createdWorkers];
  }

  if (workers.length === 0) {
    throw new Error("No worker profiles available after bootstrap.");
  }

  const earningsRows = Array.from({ length: TARGET_VERIFIED_EARNINGS }, () =>
    buildVerifiedEarning(randomChoice(workers))
  );

  await insertInBatches(earningsRows);

  console.log(
    `Seeder complete. Inserted ${TARGET_VERIFIED_EARNINGS} verified earnings rows.`
  );
};

runSeeder()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeder failed:", error.message || error);
    process.exit(1);
  });
