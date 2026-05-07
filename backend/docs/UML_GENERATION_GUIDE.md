# Django Model UML Diagram Generation Guide

This project uses **django-model2puml** to generate UML class diagrams from the Django models automatically.

## Installation & Configuration

✅ **Already Configured!**

- Package: `django-model2puml==0.5.1` (installed)
- Added to `INSTALLED_APPS` in `backend/settings.py` as `'puml_generator'`

## Generating UML Diagrams

### Basic Command
```bash
python manage.py generate_puml --file diagram.puml
```

### Useful Examples

**1. Generate all models with documentation and legend:**
```bash
python manage.py generate_puml \
  --file models_diagram.puml \
  --title "JoyFund Project Models" \
  --add-help \
  --add-legend
```

**2. Generate only local app models (excludes Django admin/auth):**
```bash
python manage.py generate_puml \
  --file joyfund_models.puml \
  --title "JoyFund App Models" \
  --include accounts beneficiaries campaigns hospitals disbursements notifications payments vouchers \
  --add-help \
  --add-legend
```

**3. Generate with model header and relationships only (no fields):**
```bash
python manage.py generate_puml \
  --file models_simple.puml \
  --title "JoyFund Model Relationships" \
  --headers-only
```

**4. Generate URL for online visualization:**
```bash
python manage.py generate_puml \
  --file models_diagram.puml \
  --title "JoyFund Project Models" \
  --add-help \
  --add-legend \
  --url
```
This will output a PlantUML.com link you can open in your browser.

## Available Command Options

| Option | Description |
|--------|-------------|
| `--file FILE` | Output filename (default: `models_diagram.puml`) |
| `--title TITLE` | Diagram title |
| `--title-font-size SIZE` | Title font size (default: 72) |
| `--add-help` | Include model docstrings |
| `--add-choices` | Show model choices/enums |
| `--add-legend` | Include symbol explanation |
| `--add-omitted-headers` | Show headers for omitted apps |
| `--headers-only` | Show only headers and relationships (no fields) |
| `--include APP1 APP2...` | Only include specific apps |
| `--omit APP1 APP2...` | Exclude specific apps |
| `--omit-history` | Exclude django-simple-history models |
| `--url` | Generate PlantUML.com visualization link |

## Visualizing the Diagrams

### Option 1: Online (PlantUML.com)
```bash
python manage.py generate_puml --file models.puml --url
# Opens: https://www.plantuml.com/plantuml/...
```

### Option 2: VS Code Preview
Install the PlantUML extension:
- Extension ID: `jebbs.plantuml`
- Then open `.puml` file and press `Alt + D`

### Option 3: Command Line Tools
```bash
# Install plantuml (requires Java)
sudo apt install plantuml

# Convert to PNG
plantuml models_diagram.puml -Tpng
# Creates: models_diagram.png

# Convert to SVG
plantuml models_diagram.puml -Tsvg
```

## Generated Diagram Features

The generated UML diagrams include:

✅ **All Model Classes** - From all Django apps  
✅ **Fields** - With field types (CharField, ForeignKey, DateField, etc.)  
✅ **Relationships** - ForeignKey, ManyToMany, OneToOne relationships  
✅ **Docstrings** - Model and field documentation  
✅ **Legend** - Symbol explanation (AutoField, ForeignKey types, etc.)  
✅ **Color Coding** - Different colors for different app categories  

## Example Generated Files

Current project has generated:
- **models_diagram.puml** (41KB, 1244+ lines) - Full project diagram with documentation

## Tips

1. **For large projects** - Use `--headers-only` to reduce complexity
2. **For specific focus** - Use `--include` to show only relevant apps
3. **For presentations** - Convert to PNG/SVG for inclusion in documents
4. **For collaboration** - Share the `.puml` file for easy viewing

## Quick Reference

```bash
cd /path/to/backend

# Quick diagram (all models)
python manage.py generate_puml --file models.puml

# Official apps only
python manage.py generate_puml \
  --file models.puml \
  --include accounts beneficiaries campaigns hospitals disbursements notifications payments vouchers

# Simple view (headers only)
python manage.py generate_puml --file models.puml --headers-only

# Full documentation
python manage.py generate_puml \
  --file models.puml \
  --title "JoyFund Models" \
  --add-help \
  --add-legend \
  --add-omitted-headers
```

## Supported Django Versions

- Django 3.2+
- Django 4.x
- Django 5.x
- Django 6.x ✅

## References

- [PyPI Package](https://pypi.org/project/django-model2puml/)
- [PlantUML Documentation](https://plantuml.com/)
- [GitHub Repository](https://github.com/sen-den/django-model2puml/)
