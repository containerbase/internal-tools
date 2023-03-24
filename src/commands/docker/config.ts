import { init } from '../../utils/docker/buildx';

export async function run(): Promise<void> {
  await init(true);
}
