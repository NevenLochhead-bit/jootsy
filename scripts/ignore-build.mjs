import {execFileSync} from 'node:child_process';
// The archive is transport. Only expanded runtime source earns a production build.
const base=process.env.CACHED_COMMIT_REF,head=process.env.COMMIT_REF;
if(!base||!head)process.exit(1);
try{const files=execFileSync('git',['diff','--name-only',base,head],{encoding:'utf8'}).trim().split('\n');process.exit(files.some(f=>/^(public\/|netlify\/|package(-lock)?\.json$|netlify\.toml$|scripts\/build\.mjs$)/.test(f))?1:0);}catch{process.exit(1);}
