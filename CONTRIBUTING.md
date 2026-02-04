# Contributing to Digital Pilot Logbook

Thank you for considering contributing to Digital Pilot Logbook! This project is built by pilots for pilots, and we welcome contributions from anyone passionate about making flight logging better.

## How to Contribute

### For Pilots (Non-Technical)

You don't need to be a developer to contribute! Here's how you can help:

1. **Report Issues**
   - Found a bug? [Open an issue](https://github.com/nirukk52/DigitalPilotLogbook/issues)
   - Calculation incorrect? Provide test cases
   - UI confusing? Suggest improvements

2. **Request Features**
   - Missing a feature from your old logbook?
   - Need support for a specific authority?
   - Have ideas for better workflows?

3. **Test & Validate**
   - Verify calculations match your authority's rules
   - Test on your devices
   - Import your logbook and report results

4. **Share Workflows**
   - How do you use the logbook?
   - What shortcuts save you time?
   - What patterns do you follow?

### For Developers

#### Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DigitalPilotLogbook
   cd DigitalPilotLogbook
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up your environment**
   - Copy `.env.example` to `.env.local` (if exists)
   - Configure your database connection

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Code Guidelines

- **TypeScript**: Use proper typing, avoid `any`
- **Components**: Keep them focused and reusable
- **Naming**: Be descriptive (`calculateSingleEngineDayPIC` not `calcSEDP`)
- **Comments**: Explain WHY, not WHAT (code should be self-documenting)
- **Testing**: Add tests for calculation logic (critical for safety)

#### Pull Request Process

1. **Update documentation** if you change user-facing features
2. **Add tests** for new calculation rules
3. **Run linter**: `npm run lint`
4. **Test your changes** thoroughly
5. **Write clear commit messages**
   ```
   Add DGCA (India) time format support
   
   - Implements decimal hour format for DGCA
   - Adds India-specific time bucket calculations
   - Updates authority selector with DGCA option
   ```

6. **Submit PR** with:
   - Clear description of changes
   - Screenshots for UI changes
   - Test results for calculation changes

### For Designers

- **UI/UX improvements** are always welcome
- **Mobile-first** design is a priority
- **Accessibility** matters (pilots use this in cockpits!)
- **Dark mode** is heavily used

### For Aviation Experts

Help us ensure regulatory compliance:

- **Verify calculation algorithms** for your authority
- **Provide test cases** from real logbooks
- **Review export formats** for compliance
- **Suggest regulatory updates** we should track

## Types of Contributions We Need

### High Priority

- [ ] Additional aviation authority support (DGCA, ANAC, etc.)
- [ ] Mobile app development (React Native/Flutter)
- [ ] Currency tracking features
- [ ] Test coverage improvements
- [ ] Performance optimization

### Medium Priority

- [ ] Additional import formats
- [ ] Advanced analytics features
- [ ] Multi-language support (i18n)
- [ ] Accessibility improvements
- [ ] Documentation improvements

### Nice to Have

- [ ] Flight school multi-user features
- [ ] Integration with flight planning tools
- [ ] Weather data integration
- [ ] Aircraft maintenance tracking

## Development Areas

### Calculation Engine (`lib/flights/`)
**Critical**: Must be accurate and well-tested
- Time bucket calculations
- Role-based allocation
- Cross-country detection
- Validation rules

### UI Components (`components/`, `app/`)
**User-facing**: Focus on speed and clarity
- Quick entry form
- Flight list views
- Analytics dashboards
- Settings/configuration

### Import/Export (`lib/import/`, `lib/export/`)
**Data integrity**: Preserve all information
- Excel/CSV import
- PDF generation
- Format conversions
- Validation

### Database (`lib/db/`)
**Foundation**: Schema must support all authorities
- Flight records
- User profiles
- Aircraft data
- Calculation history

## Testing

### Unit Tests
```bash
npm test
```

### Calculation Validation
- Test with real logbook data
- Verify against authority requirements
- Check edge cases (midnight flights, date line crossings)

### Integration Tests
- Import/export round-trip
- End-to-end user flows

## Community Guidelines

### Be Respectful
- Pilots come from all backgrounds and experience levels
- Constructive feedback only
- We're all here to make flying safer and easier

### Aviation Safety First
- Accurate calculations are non-negotiable
- When in doubt, consult regulations
- Test thoroughly before merging

### Clear Communication
- Use aviation terminology correctly
- Explain abbreviations (not everyone knows all authorities)
- Provide context for suggestions

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project documentation

Significant contributors may be added as maintainers.

## Questions?

- Open a [GitHub Discussion](https://github.com/nirukk52/DigitalPilotLogbook/discussions)
- Check existing issues and PRs
- Review project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Remember**: Every line of code you contribute helps pilots worldwide log their flights more efficiently and accurately. Your work has real impact on real aviation careers. Thank you! ✈️
