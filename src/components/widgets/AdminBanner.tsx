import Alert from "@mui/material/Alert";

export default function AdminBanner() {
  return <Alert severity="success">Jsi přihlášený jako <strong>admin</strong>. Máš přístup k administračním funkcím.</Alert>;
}