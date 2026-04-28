const { defineTool } = require('./tool');
const zod = require('zod');
const skillService = require('../services/skillService');

const DESCRIPTION =
  'Load a specialized skill that provides domain-specific instructions and workflows for specific tasks. The skill will inject detailed instructions, workflows, and access to bundled resources into the conversation context. Use this when a task matches a skill\'s description.';

const skillTool = defineTool('skill', {
  description: DESCRIPTION,
  parameters: zod.object({
    name: zod.string().describe('The name of the skill from available_skills'),
  }),
  execute: async (args, ctx) => {
    const info = await skillService.getSkillByName(args.name);
    const skill = info.data;

    const dir = skill.location.replace('file://', '');
    const base = dir.substring(0, dir.lastIndexOf('/'));

    return {
      output: [
        `<skill_content name="${skill.name}">`,
        `# Skill: ${skill.name}`,
        '',
        skill.content,
        '',
        `Base directory for this skill: ${base}`,
        '</skill_content>',
      ].join('\n'),
      title: `Loaded skill: ${skill.name}`,
      metadata: { name: skill.name, dir: base },
    };
  },
});

module.exports = { skillTool };
