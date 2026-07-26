import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError } from '@/shared/types';
import { rolesService } from '../services';
import type { Role } from '../types';

export function useRoles() {
  return useQuery<Role[], ApiError>({
    queryKey: QUERY_KEYS.roles.all,
    queryFn: () => rolesService.getRoles(),
  });
}
