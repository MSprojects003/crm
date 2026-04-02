import LeadImportDialog from "@/components/leads/LeadImportDialog";

export default function LeadImportPanel({ open, onClose, onImport }) {
  return (
    <LeadImportDialog
      open={open}
      onClose={onClose}
      onImport={() => {
        onImport();
        onClose();
      }}
    />
  );
}