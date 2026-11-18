#!/usr/bin/env python3
"""Forced SSH command installed as root at /usr/local/sbin/deploy-vanilla-home.

Only publish the exact current origin/main of this fixed, clean repository.
The SSH key disables forwarding, PTYs and all other shell commands.
"""
import datetime
import fcntl
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path('/var/www/vanilla-chan.cn')
REMOTE = 'git@github.com:Vanilla-Yukirin/vanilla-chan.cn.git'


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r'deploy-home:[a-f0-9]{40}', sys.argv[1]):
        raise SystemExit('Only deploy-home:<commit> is permitted')
    sha = sys.argv[1].split(':', 1)[1]
    with open('/run/lock/vanilla-home-deploy.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if ROOT.resolve() != ROOT or git('config', '--get', 'remote.origin.url') != REMOTE:
            raise SystemExit('Unexpected homepage repository')
        if git('branch', '--show-current') != 'main' or git('status', '--porcelain', '--untracked-files=no'):
            raise SystemExit('Homepage main must be clean; preserve local changes before deployment')
        subprocess.run(['git', '-C', str(ROOT), 'fetch', 'origin', 'main'], check=True, timeout=60)
        if git('rev-parse', 'origin/main') != sha:
            raise SystemExit('Requested commit is not current origin/main; retry the latest workflow')
        subprocess.run(['git', '-C', str(ROOT), 'merge-base', '--is-ancestor', 'HEAD', sha], check=True)
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
        backup = pathlib.Path('/var/backups/vanilla-home-deploy') / stamp
        backup.mkdir(parents=True, mode=0o700)
        git('archive', '--format=tar.gz', '-o', str(backup / 'source.tar.gz'), 'HEAD')
        (backup / 'commit.txt').write_text(git('rev-parse', 'HEAD') + '\n')
        subprocess.run(['git', '-C', str(ROOT), 'merge', '--ff-only', sha], check=True)
        subprocess.run(['curl', '--silent', '--show-error', '--fail', '--max-time', '10',
                        '--resolve', 'vanilla-chan.cn:443:127.0.0.1',
                        '-o', '/dev/null', 'https://vanilla-chan.cn/'], check=True)
        print('Published', git('rev-parse', 'HEAD'), 'backup', backup)


if __name__ == '__main__':
    main()
