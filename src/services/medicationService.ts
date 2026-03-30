import { addDays, setHours, setMinutes, format, isAfter, isBefore, startOfDay } from "date-fns";
import { Medication, MedicationSchedule } from "@/types";

export function generateMedicationSchedule(medication: Medication): MedicationSchedule[] {
  const schedules: MedicationSchedule[] = [];
  const startDate = new Date(medication.startDate);
  const endDate = new Date(medication.endDate);
  
  // Define times based on frequency
  let times: number[] = []; // Hours of the day
  switch (medication.frequency.toLowerCase()) {
    case "once daily":
      times = [8]; // 8 AM
      break;
    case "twice daily":
      times = [8, 20]; // 8 AM, 8 PM
      break;
    case "three times daily":
      times = [8, 14, 20]; // 8 AM, 2 PM, 8 PM
      break;
    case "four times daily":
      times = [8, 12, 16, 20]; // 8 AM, 12 PM, 4 PM, 8 PM
      break;
    case "with meals":
      times = [8, 13, 19]; // Breakfast, Lunch, Dinner
      break;
    case "at bedtime":
      times = [22]; // 10 PM
      break;
    default:
      times = [8];
  }

  let currentDay = startOfDay(startDate);
  const finalDay = startOfDay(endDate);

  while (isBefore(currentDay, finalDay) || currentDay.getTime() === finalDay.getTime()) {
    times.forEach((hour) => {
      const scheduledTime = setMinutes(setHours(currentDay, hour), 0);
      
      // Only add if it's after the start date/time
      if (isAfter(scheduledTime, startDate) || scheduledTime.getTime() === startDate.getTime()) {
        schedules.push({
          id: crypto.randomUUID(),
          medicationId: medication.id,
          scheduledTime: scheduledTime.toISOString(),
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    });
    currentDay = addDays(currentDay, 1);
  }

  return schedules;
}
