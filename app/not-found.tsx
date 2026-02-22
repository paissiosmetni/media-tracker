import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Film, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-muted/30">
      <div className="text-center space-y-6">
        <Film className="h-16 w-16 text-muted-foreground/40 mx-auto" />
        <div>
          <h1 className="text-4xl font-bold">404</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            This media seems to have gone missing from the library.
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
