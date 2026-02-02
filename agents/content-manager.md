# 📝 Agent: Content Manager

## Role Summary
The Content Manager handles all **JSON configuration files**, **portfolio content**, and **text data** that drives the dynamic content in the portfolio.

## Responsibilities

### Primary
- JSON configuration files
- Portfolio content updates
- Project information
- Skills and experience data
- Social links configuration
- General site settings

### Secondary
- Content validation
- SEO metadata
- Text copy review
- Content organization

## Key Files

| File | Purpose | Schema |
|------|---------|--------|
| `public/configs/generalData.json` | Site header, section names | GeneralData |
| `public/configs/skillsData.json` | Technology skills | SkillItem[] |
| `public/configs/socialsData.json` | Social media links | SocialItem[] |
| `public/configs/experiencesData.json` | Work experience | ExperienceItem[] |
| `public/configs/projectsData.json` | Project showcase | ProjectItem[] |

## Content Schema

### generalData.json
```json
{
  "header": {
    "title": "Your Name",
    "subtitle": "Full Stack Developer"
  },
  "section1Name": "About",
  "section2Name": "Skills",
  "section3Name": "Experience",
  "section4Name": "Projects"
}
```

### skillsData.json
```json
[
  {
    "name": "JavaScript",
    "logoData": { "spriteName": "javascript-logo", "scale": 1.5 },
    "pos": { "x": 0, "y": 0 }
  }
]
```

### socialsData.json
```json
[
  {
    "name": "GitHub",
    "logoData": { "spriteName": "github-logo", "scale": 1.5 },
    "pos": { "x": 0, "y": 0 },
    "link": "https://github.com/username",
    "description": "Check out my open source work"
  },
  {
    "name": "Email",
    "logoData": { "spriteName": "email-logo", "scale": 1.5 },
    "pos": { "x": 100, "y": 0 },
    "address": "email@example.com"
  }
]
```

### experiencesData.json
```json
[
  {
    "cardHeight": 200,
    "pos": { "x": 0, "y": 0 },
    "roleData": {
      "title": "Senior Developer",
      "company": "Company Name",
      "period": "2020 - Present",
      "description": "Key responsibilities and achievements"
    }
  }
]
```

### projectsData.json
```json
[
  {
    "thumbnail": "sonic-js",
    "pos": { "x": 0, "y": 0 },
    "data": {
      "name": "Sonic.js",
      "description": "A Sonic game built with JavaScript",
      "technologies": ["JavaScript", "HTML5 Canvas"],
      "liveLink": "https://demo-link.com",
      "sourceLink": "https://github.com/..."
    }
  }
]
```

## Common Tasks

### Add a New Project
1. Add project thumbnail to `public/projects/`
2. Load sprite in `src/initGame.js`
3. Add entry to `public/configs/projectsData.json`
4. Set appropriate position (relative to section center)

### Add a New Skill
1. Add logo to `public/logos/` (if new tech)
2. Load sprite in `src/initGame.js` (if new)
3. Add entry to `public/configs/skillsData.json`
4. Position within Skills section

### Update Work Experience
1. Edit `public/configs/experiencesData.json`
2. Adjust `cardHeight` based on content length
3. Update positions if adding multiple entries

### Update Social Links
1. Edit `public/configs/socialsData.json`
2. For external links: use `link` property
3. For email: use `address` property with name "Email"

## Positioning Guide

### Section Centers (approximate)
| Section | Center Position |
|---------|----------------|
| About (1) | `k.vec2(k.center().x, k.center().y - 400)` |
| Skills (2) | `k.vec2(k.center().x - 400, k.center().y)` |
| Experience (3) | `k.vec2(k.center().x + 400, k.center().y)` |
| Projects (4) | `k.vec2(k.center().x, k.center().y + 400)` |

### Relative Positioning
Positions in JSON are **relative to section center**:
```json
{
  "pos": { "x": -100, "y": 50 }
  // 100px left, 50px down from section center
}
```

## Content Validation Checklist

Before committing changes:
- [ ] JSON is valid (no trailing commas)
- [ ] All referenced sprites exist
- [ ] All links are valid URLs
- [ ] Email addresses are properly formatted
- [ ] Images exist in public folder
- [ ] Positions don't overlap excessively

## Content Best Practices

### Project Descriptions
- Keep under 150 characters for card display
- Focus on key technologies used
- Include both live demo and source links when available

### Experience Entries
- Use consistent date formatting
- Highlight key achievements
- Keep descriptions concise but informative

### Skills Organization
- Group related technologies
- Use consistent logo sizes
- Space evenly within section

## Collaboration Points

### With Game Developer
- Ensure positions work with collision system
- Test that new content appears correctly
- Verify content loads without errors

### With Graphics Developer
- Provide properly sized logo images
- Follow naming conventions for assets
- Request new sprites when needed

### With Frontend Developer
- Ensure JSON structure matches React expectations
- Coordinate on modal content display

### With Document Lead
- Document JSON schemas
- Maintain content update procedures
