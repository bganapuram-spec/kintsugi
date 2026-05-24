import ExerciseActiveScreen from "@/components/screens/ExerciseActiveScreen";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExerciseActiveScreen exerciseId={id} />;
}
