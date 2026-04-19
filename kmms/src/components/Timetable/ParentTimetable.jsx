import React, { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import TimetableGrid from "../Timetable/TimetableGrid";
import { getParentTimetable } from "../../api/timetables";

export default function ParentTimetable() {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChildTimetable() {
      try {
        const data = await getParentTimetable();

        const formattedData = (data || []).map((slot) => ({
          ...slot,
          id: slot._id,
          teacher: slot.teacherId?.name || "—",
        }));

        setTimetableData(formattedData);
      } catch (err) {
        console.error("Failed to load child timetable", err);
        setTimetableData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChildTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading timetable...
      </div>
    );
  }

  const classLabel =
    timetableData[0]?.classId?.className ||
    timetableData[0]?.classId?.name ||
    null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Child&apos;s Timetable</h2>
          <p className="text-sm text-gray-500">
            {classLabel
              ? `Weekly schedule for class ${classLabel}`
              : "View your child’s weekly class schedule"}
          </p>
        </div>
      </div>

      <Card className="min-h-[600px]">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2 text-accent" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {timetableData.length > 0 ? (
            <TimetableGrid slots={timetableData} />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No timetable slots for your child’s class yet, or no class is assigned.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
