import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import type { Profile, ProfilePartial } from '@/types/profile';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ProfileForm from '@/components/profile-form';

export interface ProfileDialogFormProps {
  className?: string;
  data?: ProfilePartial | null;
  editId?: string | null;
  afterSubmit?: (data: Profile) => void;
  onOpenChange?: (o: boolean) => void;
}

export function ProfileDialogForm({
  className,
  data,
  editId,
  afterSubmit,
  onOpenChange,
}: ProfileDialogFormProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (editId && data) return setOpen(true);
  }, [data, editId]);

  const hookSetOpen = useCallback(
    (o: boolean) => {
      onOpenChange?.(o);
      setOpen(o);
    },
    [onOpenChange],
  );

  const hookAfterSubmit = useCallback(
    (profile: Profile) => {
      afterSubmit?.(profile);
      setOpen(false);
    },
    [afterSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={hookSetOpen}>
      <DialogTrigger asChild className={cn('cursor-pointer', className)}>
        <Plus className="mr-2 size-4" />
      </DialogTrigger>
      <DialogContent className="h-full sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit' : 'Create'} profile</DialogTitle>
        </DialogHeader>
        <ProfileForm
          data={data}
          editId={editId}
          afterSubmit={hookAfterSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
