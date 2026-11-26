# GitHub Copilot pilot demo

Use Python 3.12 and its standard library. Put the contents of this directory, including `.github`, at the root of an authorized training repository with a `main` branch. Enable GitHub Actions for the training repo and prepare an issue from [ISSUE.md](ISSUE.md). This walkthrough uses issue **#17** and pull request **#42** as examples. Substitute the numbers your repository assigns.

## Author in VS Code

1. Open the training repository in VS Code and create the branch `fix/reject-zero-quantity` from Source Control.
2. Run the tests in an approved environment with Python. The baseline passes three tests. If testing remotely, run the tests in a checkout that contains the edits you are demonstrating.
3. In Copilot **Plan**, share the issue, `order_quantity.py`, and `tests/test_order_quantity.py`. Ask for the cause, the missing regression test, and the expected files to change. Check that the plan preserves the validator's interface.
4. In Copilot **Agent**, request the regression test first. Run the suite again and check that `test_rejects_zero` fails because `is_valid_quantity(0)` returns `True`.
5. Ask for the smallest fix. The validator should change from `quantity >= 0` to `quantity > 0`. Run the suite again, check that all four tests pass, and confirm the diff contains only the fix and its regression test.
6. Commit those two files and publish the branch using Source Control.

```bash
python -B -m unittest discover -s tests -v
```

Use `python3` if that is the command in the approved environment. The three runs should show `Ran 3 tests` and `OK`, then `Ran 4 tests` and `FAILED (failures=1)`, then `Ran 4 tests` and `OK`.

## Author opens the pull request in the approved remote terminal

Use the training checkout with the published branch and an authorized author account. Confirm GitHub CLI is approved and authenticated before recording.

```bash
git fetch origin
git switch fix/reject-zero-quantity
git status --short --branch
```

Create `pr-body.md` in the remote checkout for this command. Keep it outside the commit.

```markdown
## Summary

Reject zero order quantities and add a regression test for the zero boundary.

## Verification

The regression test failed before the fix. All four tests passed after the fix.

Closes #17
```

```bash
gh pr create --base main --title "Reject zero order quantities" --body-file pr-body.md
```

Hand off the resulting PR number to a separate authorized reviewer. Sample output uses a fictional repository.

```text
https://github.com/training-org/ai-pilot-demo/pull/42
```

## Reviewer inspects and records the decision in the approved remote terminal

From the training checkout, the reviewer uses their own GitHub account with the repository permissions needed for review.

```bash
gh pr view 42
gh pr diff 42
gh pr checks 42
```

Verify the PR title and issue reference, the boundary change, the new test for `0`, and the **Unit tests** check. Confirm that `1` and `5` are accepted and `0` and `-1` are rejected. If checks are pending, use `gh pr checks 42 --watch` and review the final result before deciding.

The expected change and example check are shown below. The check duration and link are illustrative.

```diff
-    return quantity >= 0
+    return quantity > 0
+
+    def test_rejects_zero(self):
+        self.assertFalse(is_valid_quantity(0))
```

```text
Unit tests  pass  8s  https://github.com/training-org/ai-pilot-demo/actions/runs/12345/job/67890
```

Approve when the change and checks match the issue. Request changes when you find a specific problem. Submit the command that matches your decision.

```bash
gh pr review 42 --approve --body "Regression and checks verified."
```

```bash
gh pr review 42 --request-changes --body "Please add a regression test that verifies quantity 0 is rejected."
```

Read back the posted review and retain its evidence with the PR link, test results, and check status. Example approval output is shown below.

```bash
gh pr view 42 --json reviews --jq '.reviews[] | "\(.author.login) \(.state): \(.body)"'
```

```text
training-reviewer APPROVED: Regression and checks verified.
```

[GitHub CLI `gh pr create`](https://cli.github.com/manual/gh_pr_create) · [View](https://cli.github.com/manual/gh_pr_view) · [Diff](https://cli.github.com/manual/gh_pr_diff) · [Checks](https://cli.github.com/manual/gh_pr_checks) · [Review](https://cli.github.com/manual/gh_pr_review)
