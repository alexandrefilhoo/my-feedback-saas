import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Feedback Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Enter your feature request..." />
          <Button className="w-full">Submit Request</Button>
        </CardContent>
      </Card>
    </main>
  );
}
