#!/usr/bin/env python3
"""
Validate levels.json to ensure all levels are completable with common English words.
"""
import json
import sys
from collections import Counter

# Load the English dictionary
DICT_FILE = "constants/english-dictionary.ts"
LEVELS_FILE = "constants/levels.json"

def load_dictionary():
    """Load words from the TypeScript dictionary file."""
    words = set()
    with open(DICT_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('"') and line.endswith('",'):
                word = line[1:-2]  # Remove quotes and comma
                words.add(word)
    return words

def can_form_word(word, letters):
    """Check if a word can be formed from the given letters."""
    word_counter = Counter(word.upper())
    letters_counter = Counter([l.upper() for l in letters])
    
    for char, count in word_counter.items():
        if letters_counter[char] < count:
            return False
    return True

def validate_level(level, level_num, category, dictionary):
    """Validate a single level."""
    issues = []
    
    # Check required fields
    if 'letters' not in level:
        issues.append(f"Missing 'letters' field")
        return issues
    
    if 'crosswordWords' not in level:
        issues.append(f"Missing 'crosswordWords' field")
        return issues
    
    letters = level['letters']
    words = level['crosswordWords']
    base_word = level.get('baseWord', '')
    
    # Check if base word is in crossword words
    if base_word and base_word.upper() not in [w.upper() for w in words]:
        issues.append(f"Base word '{base_word}' not in crossword words")
    
    # Check each word
    for word in words:
        word_upper = word.upper()
        
        # Check if word can be formed from letters
        if not can_form_word(word_upper, letters):
            issues.append(f"Word '{word}' cannot be formed from letters {letters}")
        
        # Check if word is in dictionary (only warn for uncommon words)
        if word_upper not in dictionary and len(word) > 2:
            issues.append(f"Word '{word}' not in common dictionary (may be valid but uncommon)")
    
    # Check for duplicates
    if len(words) != len(set([w.upper() for w in words])):
        issues.append(f"Duplicate words found")
    
    # Check minimum word count
    if len(words) < 3:
        issues.append(f"Only {len(words)} words (minimum 3 recommended)")
    
    return issues

def main():
    print("Loading English dictionary...")
    dictionary = load_dictionary()
    print(f"Loaded {len(dictionary)} words from dictionary\n")
    
    print("Loading levels.json...")
    with open(LEVELS_FILE, 'r') as f:
        levels_data = json.load(f)
    
    total_levels = 0
    total_issues = 0
    categories_with_issues = {}
    
    for category, levels in levels_data.items():
        print(f"\n{'='*60}")
        print(f"Validating {category} ({len(levels)} levels)")
        print(f"{'='*60}")
        
        category_issues = []
        
        for i, level in enumerate(levels, 1):
            level_num = level.get('level', i)
            issues = validate_level(level, level_num, category, dictionary)
            
            if issues:
                total_issues += len(issues)
                category_issues.append((level_num, issues))
                print(f"\n❌ Level {level_num}:")
                for issue in issues:
                    print(f"   - {issue}")
            else:
                print(f"✅ Level {level_num}: OK")
            
            total_levels += 1
        
        if category_issues:
            categories_with_issues[category] = category_issues
    
    # Summary
    print(f"\n\n{'='*60}")
    print(f"VALIDATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total levels validated: {total_levels}")
    print(f"Levels with issues: {len([1 for cat in categories_with_issues.values() for _ in cat])}")
    print(f"Total issues found: {total_issues}")
    
    if categories_with_issues:
        print(f"\nCategories with issues:")
        for cat, issues in categories_with_issues.items():
            print(f"  - {cat}: {len(issues)} levels")
    else:
        print(f"\n✅ All levels passed validation!")
    
    return 0 if not categories_with_issues else 1

if __name__ == "__main__":
    sys.exit(main())
