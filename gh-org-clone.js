const ins = require("util").inspect;
const deb = (...args) => { 
    if (debug) console.log(ins(...args, {depth: null})); 
};

//const path = require('path');
const shell = require('shelljs');

const { 
  showError, 
  //sh, 
  //shContinue, shStderr, gh, 
  //ghCont, 
  //ghCode, 
  names2urls, 
  //getUserLogin,
  //getRepoListFromFile, 
  //getRepoListFromAPISearch,
  //getNumberOfCommits,
  //branches,
  numBranches,
  //RepoIsEmpty,
  getRepoList,
  fzfGetOrg,
  //addImplicitOrgIfNeeded,
  addSubmodules,
  setDefaultOrg
} = require('@crguezl/gh-utilities');

const { Command } = require('commander');

const program = new Command();
program.version(require('./package.json').version);

program
  .name("gh org-clone")
  .usage("[options] [organization] [options for git clone]")
  .allowUnknownOption()
  .option('-s, --search <query>', "search <query> using GitHub Search API")
  .option('-r, --regexp <regexp>', 'filter <query> results using <regexp>')
  .option('-c, --csr <comma separated list of repos>', 'the list of repos is specified as a comma separated list')
  .option('-f, --file <file>', 'file with the list of repos, one per line')
  .option('-n --dryrun','just show what repos will be cloned')
  .option('-o --org <org>', 'Use as organization')
  .option('   --default', 'Set "org" as default organization for future uses')
  .option('-D --depth <depth>','Create a shallow clone with a history truncated to <depth> number of commits')
  .option('-p --parallel <int>', 'number of concurrent  processes during the cloning stage', 2);

program.addHelpText('after', `
  - If the organization is not explicitly specified or there is a default org, 
    the selection will be done interactively among the list of your organizations
  - You can set the default organization through the "--default" option for future uses of this program
  - If no repos are specified the selection of repos will be done interactively among the repos in the org 
  - Option '-s' assumes all the repos belong to the same org
  - When called with option  '-s .', the dot '.' refers to all the repos.  fzf will be open to select the repos
  - Not conflicting "git clone" options as "--recurse-submodules" can be passed as additional options
  - When in fzf, use CTRL-A to select all, tab to select/deselect
  `
);
  
program.parse(process.argv);
//if (process.argv.length === 2) program.help()

const debug = program.debug; 

const options = program.opts();
// console.log(options.search || options.file || options.csr);
// console.log(program.args)

if (!(options.search || options.file || options.csr)) options.search = '.';

if (!shell.which('git')) {
  showError('Sorry, this extension requires git installed!');
}
if (!shell.which('gh')) {
    showError('Sorry, this extension requires GitHub Cli (gh) installed!');
}

debugger;
if (!options.org && (program.args.length == 1) ) options.org = program.args.shift();

let org = options.org || fzfGetOrg();

if (options.default) setDefaultOrg(org);


// Set org as default org 


let repos = getRepoList(options, org);

if (repos.length === 0) {
  console.log(`No matching repos found in owner "${org}"!`);
  process.exit(0);
}

if (options.regexp) {
    let regexp = new RegExp(options.regexp,'i');
    repos = repos.filter(rn => {
      return regexp.test(rn)
    });
}

if (options.dryrun) {

    //console.error("Only repos with more than one commit will be added as submodules:")

    //console.log(repos);
    let nb = numBranches(repos)
    repos.forEach((r,i) => {
      if (nb[i] === 0)
        console.error(`${r} is empty!`);
      else console.log(r);
    });

    process.exit(0);
}

let urls = names2urls(repos);

addSubmodules({
  urls, 
  repos, 
  parallel: options.parallel, 
  depth: options.depth, 
  cloneOnly: true, 
  submoduleArgs: [],
  cloneArgs: program.args,
});

/*

######### UNIFIED graphQL NO parallelism in the downloads of repos

# unified graphql request for empty repos download complete of 1 repo
➜  asyncserialize git:(master) ✗ time gh submodule-add -s 'asyncserialize' --org ULL-MII-SYTWS-2122
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-lorenaolaru because is empty!
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-mstoisor because is empty!
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-crguezl because is empty!
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-ddialar because is empty!
git submodule add https://github.com/ULL-MII-SYTWS-2122/asyncserialize-alu0101102726
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/sytws2122/practicas-alumnos/asyncserialize/asyncserialize-alu0101102726'...
Skipping to add repo https://github.com/ULL-MII-SYTWS-2122/asyncserialize-PaulaExposito because is empty!
gh submodule-add -s 'asyncserialize' --org ULL-MII-SYTWS-2122  0,99s user 0,43s system 36% cpu 3,946 total

# unified graphql request for empty repos -n option. No downloads
➜  asyncserialize git:(master) ✗ time gh submodule-add -s asyncserialize -o ULL-MII-SYTWS-2122 -n
Only repos with more than one commit will be added as submodules:
ULL-MII-SYTWS-2122/asyncserialize-mstoisor is empty!
ULL-MII-SYTWS-2122/asyncserialize-lorenaolaru is empty!
ULL-MII-SYTWS-2122/asyncserialize-crguezl is empty!
ULL-MII-SYTWS-2122/asyncserialize-ddialar is empty!
ULL-MII-SYTWS-2122/asyncserialize-alu0101102726
ULL-MII-SYTWS-2122/asyncserialize-PaulaExposito is empty!
gh submodule-add -s asyncserialize -o ULL-MII-SYTWS-2122 -n  0,39s user 0,15s system 26% cpu 2,040 total

# unified graphql request for empty repos -n option. 16 repos. No downloads
➜  aprender-markdown git:(master) ✗ time gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122 -n
Only repos with more than one commit will be added as submodules:
ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
ULL-MFP-AET-2122/gitpod-template
gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122 -n  0,40s user 0,16s system 26% cpu 2,122 total

# Unified graphql request for empty repos -n option. 16 downloads

git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-anabel-coello-perez-alu0100885200'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adela-gonzalez-maury-alu0101116204'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-wim-van-hoye-alu0101520377'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adrian-prieto-curbelo_alu0100948387'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-manuel_curbelo_alu0100045130'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-carlos-guerra-olivera-alu0100703535'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-chloe-boistel-perez-alu0100788020'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-marrero-diaz-alu100825008'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-angel-ramallobenitez-alu0100312898'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-nestor-gonzalez-lopez-alu0100108859'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-yeray_exposito_garcia_alu0100951844'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-jaime-garcia-bullejos-alu0100906806'...
git submodule add https://github.com/ULL-MFP-AET-2122/gitpod-template
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/gitpod-template'...
gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122  4,05s user 2,63s system 27% cpu 24,702 total

### Sequential

# 16 repos no downloads
➜  aprender-markdown git:(master) ✗ time gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122 -n
Only repos with more than one commit will be added as submodules:
ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
ULL-MFP-AET-2122/gitpod-template
gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122 -n  2,33s user 0,83s system 26% cpu 11,815 total

➜  aprender-markdown git:(master) ✗ time gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-anabel-coello-perez-alu0100885200
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-anabel-coello-perez-alu0100885200'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-gonzalez-sarasola-alu0100260076'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-wim-van-hoye-alu0101520377
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-wim-van-hoye-alu0101520377'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adela-gonzalez-maury-alu0101116204
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adela-gonzalez-maury-alu0101116204'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-ivan-gonzalez-aguiar-alu0100551266'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-carlos-guerra-olivera-alu0100703535
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-carlos-guerra-olivera-alu0100703535'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-adrian-prieto-curbelo_alu0100948387
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-adrian-prieto-curbelo_alu0100948387'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-manuel_curbelo_alu0100045130
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-manuel_curbelo_alu0100045130'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-chloe-boistel-perez-alu0100788020
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-chloe-boistel-perez-alu0100788020'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-noelia-rodriguez-hernandez-alu0100595420'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-alejandro-marrero-diaz-alu100825008
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-alejandro-marrero-diaz-alu100825008'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-yeray_exposito_garcia_alu0100951844
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-yeray_exposito_garcia_alu0100951844'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-angel-ramallobenitez-alu0100312898
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-angel-ramallobenitez-alu0100312898'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-nestor-gonzalez-lopez-alu0100108859
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-nestor-gonzalez-lopez-alu0100108859'...
git submodule add https://github.com/ULL-MFP-AET-2122/aprender-markdown-jaime-garcia-bullejos-alu0100906806
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/aprender-markdown-jaime-garcia-bullejos-alu0100906806'...
git submodule add https://github.com/ULL-MFP-AET-2122/gitpod-template
Clonando en '/Users/casianorodriguezleon/campus-virtual/2122/aet2122/practicas-alumnos/aprender-markdown/gitpod-template'...
gh submodule-add -s 'aprender-markdown' --org ULL-MFP-AET-2122  5,96s user 3,25s system 27% cpu 33,934 total


## Parallel clone and graphql unified

16 repos gh submodule-add -s aprender-markdown --org ULL-MFP-AET-2122  4,30s user 2,87s system 57% cpu 12,540 total
*/