'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteIcon, Edit, Rocket } from 'lucide-react';

import type { Profile } from '@/types/profile';
import { useProfiles } from '@/lib/effects';

import { ProfileDialogDelete } from './profile-dialog-delete';
import { ProfileDialogForm } from './profile-dialog-form';
import { DataTable } from './ui/data-table';

export interface ProfileTableProps {
  current?: string | null;
  onConnect: (profile: string) => () => void;
}

function ProfileNameHeader() {
  return <p className="font-bold">Profiles</p>;
}

function ProfileNameCell({
  row,
  current,
}: {
  row: any;
  current?: string | null;
}) {
  return (
    <div className="flex items-center">
      {current === row.original.name ? (
        <div className="size-4 animate-pulse rounded-full bg-green-500" />
      ) : (
        <div className="size-4 rounded-full bg-red-500" />
      )}
      <p className="ml-2">{row.original.name}</p>
    </div>
  );
}

function ProfileActions({
  row,
  onConnect,
}: {
  row: any;
  onConnect: (profile: string) => () => void;
}) {
  const profile = row.original;
  const router = useRouter();
  const pathname = usePathname();

  const onDelete = useCallback(() => {
    const query = new URLSearchParams();
    query.set('d', profile.name);
    router.push(`${pathname}?${query.toString()}`);
  }, [pathname, profile.name, router]);

  const onEdit = useCallback(() => {
    const query = new URLSearchParams();
    query.set('e', profile.name);
    router.push(`${pathname}?${query.toString()}`);
  }, [pathname, profile.name, router]);

  return (
    <div className="flex flex-row">
      <button
        className="flex w-full justify-between"
        title="Delete"
        onClick={onDelete}
      >
        <DeleteIcon className="ml-2 size-4 text-red-500" />
      </button>
      <button
        className="flex w-full justify-between"
        title="Edit"
        onClick={onEdit}
      >
        <Edit className="ml-2 size-4 text-blue-500" />
      </button>
      <button
        className="flex w-full justify-between"
        title="Connect"
        onClick={onConnect(profile.name)}
      >
        <Rocket className="ml-2 size-4 text-green-500" />
      </button>
    </div>
  );
}

export function ProfileTable({ current, onConnect }: ProfileTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const qs = useSearchParams();
  const editId = qs.get('e');
  const [data, , , setData, fetchData] = useProfiles();

  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ProfileNameHeader,
        cell: ({ row }) => <ProfileNameCell row={row} current={current} />,
      },
      {
        id: 'actions',
        cell: ({ row }) => <ProfileActions row={row} onConnect={onConnect} />,
      },
    ],
    [current, onConnect],
  );

  const tableData = useMemo(() => {
    return (data || []).sort((a: any) => (a.name === current ? -1 : 1));
  }, [current, data]);

  const editProfile = useMemo(
    () => tableData.find(({ name }) => name === editId) || null,
    [editId, tableData],
  );

  const onDelete = useCallback(() => fetchData(), [fetchData]);

  const onProfileFormOpenChange = useCallback(
    (o: boolean) => {
      if (o) return;
      router.replace(pathname);
    },
    [router, pathname],
  );

  const afterProfileForm = useCallback(
    (profile: Profile) => {
      if (editId) {
        setData((d) => d?.map((p) => (p.name === editId ? profile : p)));
      } else {
        setData((d) => [...(d || []), profile]);
      }
      router.replace(pathname);
    },
    [setData, editId, router, pathname],
  );

  return (
    <div>
      <ProfileDialogDelete onDelete={onDelete} />
      <div className="relative mr-2 flex justify-end">
        <ProfileDialogForm
          data={editProfile}
          editId={editId}
          afterSubmit={afterProfileForm}
          onOpenChange={onProfileFormOpenChange}
          className="absolute top-3 z-10 cursor-pointer"
        />
      </div>
      <DataTable columns={columns} data={tableData} />
    </div>
  );
}
