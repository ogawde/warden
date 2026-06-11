import type { User } from "@warden/db";
import { ResourceNotFoundError } from "./resource-not-found-error";

type OwnedRepository = {
  userId: string | null;
};

export function assertRepositoryOwnedByUser(
  repository: OwnedRepository,
  user: User
): void {
  if (repository.userId !== user.id) {
    throw new ResourceNotFoundError("Repository not found");
  }
}
