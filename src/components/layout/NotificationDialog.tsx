import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SystemNotification } from "@/types";

interface NotificationDialogProps {
  notification: SystemNotification;
  open: boolean;
  onAcknowledge: () => void;
}

export function NotificationDialog({ notification, open, onAcknowledge }: NotificationDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aviso Importante do Sistema</AlertDialogTitle>
          <AlertDialogDescription>
            {notification.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onAcknowledge}>
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}