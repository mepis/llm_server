# Summary


Write a brief executive summary for this app.

# Instructions

## Instructions Phase 1 (Planning)

1. Read these instructions before proceeding. Identify any sections that contain a '' statement.
   2A. If any section of this document conatins a '' statement, immediately stop and notify the user. Do not proceed any further.
   2B. If no sections contain a '' statement, proceed.
2. Now, re-read and review these instructions thoroughly. Develop a detailed plan to build this application.
3. Read the documentation links below (if available). Update the development plan as needed with information from the documentation links as needed.
4. Ask the user for further information to clarify requirements or options in the development plan if needed.
5. Review the development plan. Idenfity any gaps or potential issues, and update the development plan as needed.
   5A. Repeat step 5 until no further issues are identified in the development plan.

## Instructions Phase 2 (Preperation)

**Memory Preperation**

1. Create a file called 'AGENTS.md' in the root of this repository.

**Progress Logs Preperation**

1. Create a folder called 'logs'. Use this folder for all logs.
2. Create a folder called 'progress' in the 'logs' folder. Use this folder for all progress logs.
3. Create a file called 'progress_index.md' in the 'logs' folder.

**Change Logs Preperation**

1. Create a folder called 'change_logs' in the 'logs' folder. Use this folder for all change logs.
2. Create a 'changelog_index.md' file in the change_logs folder.
3. Create a change a new change log after after every commit. Update the 'changelog_index.md' file for each new change log.

**Documentation Preperation**

1. Create a folder call 'docs' in the root of this repository. Use this folder for all documentation.
2. Create a file called 'index.md' in the 'docs' folder.

## Instructions Phase 3 (Development)

1. Develop the application per the development plan, instructions, and requirements.

## Instructions Phase 4 (QA and code reviews)

**QA Testing**

1. Create unit tests for all functions in this application.
2. Create scripts that automate testing in the future.
3. Update the AGENTS.md file with instructions to create unit tests for new features or additions to the application in the future, or update current unit tests as needed when updates or modifications are made to the application (including resolving bugs).
4. Perform QA testing on all functions and features in this app.
5. Run the application as a user to ensure the expected outcome is achieved during user interaction.
6. Create a list of any bugs or security issues discovered while performing QA tests.
7. Develop a remediation plan for fixing bugs or security issues that were discovered.
8. Remediate any issues per the remediation plan.
9. Repeat steps 4 through 8 until no further bugs or security issues are discovered.

## Instructions Phase 5 (Complete documentation)

1. Review all documentation created while developing this application thus far.
2. Update all documentation as needed. Ensure documentation is complete and easy-to-read. Ensure all functions, APIs, etc. are thoroughly documented.
3. Create documentation for users and developers as needed.
4. Repeat steps 1 through 4 until you deem no further documentation updates are needed.

# Documentation Resources

- AGENTS.md file - https://opencode.ai/docs/rules/

# Additional Information

On a scale of 1 to 10, how much creative liberty should I have when making choices for building this application, where 1 equals no creativy liberty (I should ask the user for clarification on anything ambigous) and 10 equals complete autonomy (I am able to make any choices I feel are required while adhering to the instructions and requirements).


Answer:

# Requirements

## Plan Requirements

- Create a planning document in the 'logs' folder. Use this planning document to document the application plan and progress as you build this application.
- Create concise phases when developing a plan for this project.
- Phases in the development plan do not need to match phases in these instructions.
- Each phase should include a detailed todo list.
- Each item on the todo lists should represent a small, easily completable step that builds on previous todo items. The goal of each todo item is to limit complexity of planning and implementing this application as much as possible.
- As each todo item is completed, the todo item should be marked as completed in the planning document.
- Todo items can be recursive and can be updated as 'not completed' after they are marked 'completed' if needed (eg. when performaing QA tasks), but changing the status of a todo item should be avoided if possible.
- The plan can be updated as required, but only if a plan or phase does not accomodate a required tasks. Update the plan sparingly.
- Progress should be updated per the requirements below after each phase has been completed.

## AGENTS.md Requirements

- Use the AGENTS.md file to store any directives issued to you, either from these instructions or through additional instructions issued during interaction with the user.

## Work Requirements

- Create a git commit message and commit all work after each feature is completed or each bug is fixed. Push the commit after commiting.
- Use as few dependancies as possible. Only use external libraries or dependancies when other options are not available.

## Change Log Requirements

- Create a change log in the 'change_logs' folder after every commit.
- Change logs must be created as new files. Include the date in the change log file name.
- Use the 'changelog_index.md' file as an index for the change log files.
- Update the 'changelog_index.md' after every commit.
- Include a merge request title and summary in each change log.

## Progress Log Requirements

- As you progress through this project, all progress must be logged in log files in the /logs/progress folder.
- The /logs/progress folder must contain an index.md file that links to each progress log file. Links must include brief summaries of work in such a way that an LLM or human can easily locate and navigate to specific progress logs when attempting to locate specific information.

## Documentation Requirements

- Documentation must be created in unique, individual markdown files. Each documentation file should only contain a concise, unique idea or topic.
- The 'index.md' file should contain an index with links and summaries to each documentation file. Summaries should be brief and contain up two two sentances at most. Only include summaries if the text for the link to the documentation page is not descriptive enough for an LLM.
- If building a front-end environment, integrate documentation into a unique section in the front-end.

## Feature Requirements

**Default Requirements**

- Create scripts to download and install any system dependancies as needed. Scripts should target the OS options below if selected.
- Create scripts to install the repostory and prepare it for running as needed.
- Create scripts to install services for the repository so the application launches on system startup as needed.
- Create a service that monitors the production branch (often called 'master' or 'main') for new commits, and if any are detected, update the local repository, installs new depencies and system packages, update .env files, etc. as needed. The script should also restart services that are running when required.
  -- Consider this requirement when creating any application services that may run or monitor jobs so that the application services or jobs can be gracefully paused and restarted after this service restarts the application and its services.

**Feature Requirements**

//Erase this section if not needed

- List application features here such as user management systems, etc.

## Application Requirements


//Erase this section if not needed

- application requirements go here
- Application requirements are things like folder structures, following specific types of standard practices, etc, color scheme, etc.

## Technical Requirements

**Additional Requirements**


//Erase this section if not needed

- EXAMPLE: Create a bullet point list of specific technical requirements if no options exists below

### Technical Requirement Options

The user may select multiple options below. If no options are selected in the sections below, use your best judgement, and select an option except for the following sections:

- Hosting
- Frontend serving options
- Operating system

If no options are selected for the sections in the list above, target a self-hosted environment.

**Project contains a .env file with secrets and other config options**
If 'yes' use configurations in the .env file

[] Yes
[] No
[] Other:

**Programming Paradigms**
[] Object Oriented
[] Functional
[] Imperative
[] Declarative
[] Procedural
[] Other:

**Database Options**
[] MongoDB
[] SQLLite
[] MySQL or MySQL Compatible (Eg. MariaDB)
[] Postgres
[] Reddis
[] Other:

**Backend Language**
[] Go
[] PHP
[] Rust
[] Node.js
[] Bun
[] Other:

**Frontend Framework Options**
[] Vue.js
[] React
[] Angular
[] None
[] Other:

**Frontend Serving Options**
[] Single page application
[] Static website
[] Server-side rendered website
[] Other:

**Webserver**
[] Apache2
[] Nginx
[] Caddy
[] Other:

**Operating System**
[] Ubuntu 24
[] Ubuntu 25
[] Debian 12
[] Debian 13
[] Arch
[] CachyOS
[] Other:

**Hosting**
[] AWS EC2
[] AWS Lighthouse
[] AWS S3
[] AWS S3 Compatible
[] Generic VPS
[] Generic self-hosting
[] Cloudflare Pages
[] Other:
