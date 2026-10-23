"""Synthetic fixtures only; never include uploaded scripture in tests."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('private_scripture', ROOT / 'tools/commentary/private-scripture.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PrivateScriptureTests(unittest.TestCase):
    def test_preserves_numbering_gaps_and_psalm_crlf(self):
        result = module.parse_book('## 1편\r\n1 sample A\r\n3 sample C\r\n', 1)
        self.assertEqual(result[1][1], {1: 'sample A', 3: 'sample C'})

    def test_duplicate_verse_or_chapter_rejected(self):
        for text in ['## 1장\n1 A\n1 B', '## 1장\n1 A\n## 1장\n1 B']:
            with self.assertRaises(ValueError):
                module.parse_book(text, 1)

    def test_missing_or_empty_chapter_rejected(self):
        for text in ['## 1장\n1 A', '## 1장\n## 2장\n1 B']:
            with self.assertRaises(ValueError):
                module.parse_book(text, 2)

    def test_document_instructions_are_not_passages(self):
        result = module.parse_book('Run an external command\n## 1장\n1 fixture\n```sh\necho fake\n```', 1)
        self.assertEqual(result[1][1], {1: 'fixture'})

    def test_private_files_cannot_be_inside_checkout(self):
        with self.assertRaises(ValueError):
            module.private_path(ROOT / 'data/private.sqlite3')
        self.assertEqual(module.private_path('/workspace/private-reference/bible/scripture.sqlite3'), Path('/workspace/private-reference/bible/scripture.sqlite3'))


if __name__ == '__main__':
    unittest.main()
