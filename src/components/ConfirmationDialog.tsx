import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

const ConfirmationDialog = ({
  open,
  title,
  description,
  onResult,
}: {
  open: boolean;
  title: string;
  description: string;
  onResult: (result: boolean) => void;
}) => (
  <Dialog open={open}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>
        {description}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={() => {
          onResult(false);
        }}
      >
        Cancel
      </Button>
      <Button
        color="primary"
        onClick={() => {
          onResult(true);
        }}
        autoFocus
      >
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmationDialog;
