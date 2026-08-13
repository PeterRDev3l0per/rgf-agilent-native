import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<boolean | void> | void;
}

const NewProjectDialog = ({ open, onOpenChange, onSubmit }: NewProjectDialogProps) => {
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await onSubmit(name.trim());
      if (res === false) {
        setErrorMsg(language === "es" ? "Un proyecto con este nombre ya existe." : "A project with this name already exists.");
        return;
      }
      setName("");
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || (language === "es" ? "Error al crear proyecto." : "Error creating project."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setErrorMsg("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[14px] border border-border/50 bg-popover p-0 gap-0 max-w-[400px]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-foreground text-xl font-semibold">
            {t("nav.newProject")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-muted-foreground text-sm font-medium">
              {t("project.nameLabel") || "Nombre del Proyecto"}
            </label>
            <Input
              id="input-project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="E.g. opencode-backlog-native"
              className="h-12 rounded-[8px] border border-border bg-background text-foreground placeholder:text-muted-foreground/50"
              autoFocus
            />
            {errorMsg && <p className="text-xs text-destructive mt-1 font-medium">{errorMsg}</p>}
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={submitting}
              className="h-10 rounded-[8px] border border-border bg-transparent text-foreground hover:bg-accent/10"
            >
              {t("common.cancel") || "Cancelar"}
            </Button>
            <Button 
              id="btn-create-project-submit"
              type="submit"
              disabled={!name.trim() || submitting}
              className="h-10 rounded-[8px] bg-foreground text-background font-medium hover:bg-foreground/90"
            >
              {submitting ? "Creando..." : t("nav.newProject")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;