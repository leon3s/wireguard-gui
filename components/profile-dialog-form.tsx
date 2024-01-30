import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import type { Profile, ProfilePartial } from '@/types/profile';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  console.log('ProfileDialogForm:', {
    editId,
    data,
    open,
  });

  const hookSetOpen = useCallback(
    (o: boolean) => {
      console.log('hookSetOpen:', { o });
      setOpen(o);
      onOpenChange?.(o);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (editId && data) {
      return setOpen(true);
    } else {
      return setOpen(false);
    }
  }, [editId, data]);

  const openModal = useCallback(() => {
    setOpen(true);
  }, []);

  const hookAfterSubmit = useCallback(
    (profile: Profile) => {
      console.log('hookAfterSubmit', { profile });
      afterSubmit?.(profile);
    },
    [afterSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={hookSetOpen}>
      <div onClick={openModal} className={cn('cursor-pointer', className)}>
        <Plus className="mr-2 size-4" />
      </div>
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
