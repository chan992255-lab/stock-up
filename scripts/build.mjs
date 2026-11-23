import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// 이 워크스페이스의 파일 시스템은 삭제 중인 파일 핸들을 잠시 붙잡아
// vite의 emptyOutDir가 ENOTEMPTY로 실패할 수 있다.
// 그래서 기존 dist는 프로젝트 밖으로 옮겨 두고 새로 빌드한다.
const root = process.cwd();
const trashRoot = path.resolve(root, '..', '..', 'tmp', 'stock-up-builds');

function stash(dir) {
  const from = path.join(root, dir);
  if (!fs.existsSync(from)) return;
  try {
    fs.mkdirSync(trashRoot, { recursive: true });
    fs.renameSync(from, path.join(trashRoot, `${dir}-${Date.now()}`));
  } catch {
    // 옮기지 못하면 그대로 두고 계속한다.
  }
}

stash('dist');
stash('dist_stale');

execSync('npx vite build', { stdio: 'inherit' });
