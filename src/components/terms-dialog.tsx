import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TermsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Terms & Privacy</DialogTitle>
          <DialogDescription>
            Your data, your control.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm text-muted-foreground">
          <p>
            URA Private Storage stores your diary and files under your private 6-digit ID. We do not access, read, or moderate your content.
          </p>
          <p>
            <strong>Keep your ID secret.</strong> It is the only key to your data. By using the app you accept that URA is a storage provider and you are responsible for securing your ID.
          </p>
          <p>
            For premium payments, you will be redirected to the payment provider (feature not integrated in this demo).
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
