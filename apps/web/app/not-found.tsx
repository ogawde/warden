import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-warden-mint/25">
            <FileQuestionIcon className="size-5 text-warden-sea" />
          </div>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or may have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button className="shadow-button" render={<Link href="/" />}>
            Back to home
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
