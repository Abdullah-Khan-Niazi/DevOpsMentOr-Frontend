import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import type { ApiError, PaginatedResponse } from '@/shared/types';
import { usersService } from '../services';
import type { User } from '../types';

export function useUsers() {
  return useQuery<PaginatedResponse<User>, ApiError>({
    queryKey: QUERY_KEYS.users.all,
    queryFn: () => usersService.getUsers(),
  });
}
