---
title: "AI 002 - 《用 Git Worktrees 解锁并行 AI 编码》"
date: 2025-02-19
url: https://sorrycc.com/ai-multiple-cursor
---

发布于 2025年2月19日

# AI 002 - 《用 Git Worktrees 解锁并行 AI 编码》

> 本篇文章为 AI 生成。

AI 编码助手很棒，但有时候只用一个感觉就像试图用一根小吸管倒一加仑咖啡。

我们都用过 Cursor 的 Composer 这样的 AI 编码助手，它们简直是魔法。需要生成样板代码？搞定。需要重构复杂的函数？小菜一碟。想让 AI 来 debug 那些你盯着看了一下午都没看出来的 bug？没问题。

但问题是，这些小助手，一次只能做一件事。就像你家里的 Wi-Fi，当只有一个设备连接时，速度飞快。但一旦你的伴侣开始看 Netflix，你的孩子开始打 Fortnite，突然之间，一切都慢了下来，卡得像上个世纪的拨号上网。

对于 AI 编码助手来说也是如此。当你处理大型任务，或者想尝试不同的方法时，单个 Composer 实例可能会变成瓶颈。看着它在那里慢慢悠悠地转圈圈，感觉时间都停止了，效率也降到了冰点。

更糟糕的是，如果你同时运行多个 AI 助手，试图让他们并行工作？那简直是一场灾难片。它们会像幼儿园抢玩具的小朋友一样，争抢着修改同一个文件，最后的结果就是一堆冲突，让你怀疑人生。

传统的 Git 分支可以稍微缓解一下这个问题，但对于快速实验来说，还是太笨重了。每次都要创建分支、切换分支、合并分支，光是想想就觉得头大。

那么，有没有什么办法可以让我们像开挂一样，同时运行多个 AI 编码助手，让他们并行工作，互不干扰，效率翻倍呢？

当然有！答案就是：**Git Worktrees**。

**Worktrees 是什么鬼？**

如果你还没听说过 Git Worktrees，那你就 out 了。简单来说，Worktrees 就像是给你的 Git 仓库开了个“分身术”。你可以创建多个独立的“工作区”，每个工作区都连接到同一个仓库，但可以检出不同的分支。

想象一下，你的主项目是一个大房子，而 Worktrees 就是在房子旁边建了几个车库。每个车库都是独立的，你可以随便在里面折腾，但它们都共享同一个地基（Git 仓库）。

**如何用 Worktrees + Cursor Composer 炸裂你的编码速度**

使用 Worktrees + Cursor Composer 的工作流程非常简单粗暴：

1.  **创建 Worktrees：** 打开你的终端，用这行命令创建新的 Worktree 和分支：
    
    ```bash
    git worktree add -b <branch-name> ../<project-name>-<branch-name>
    ```
    
    `-b` 标志表示创建新分支。 `../<project-name>-<branch-name>` 这部分指定了 Worktree 的存放路径，把它放在兄弟目录下，更整洁。(信我，这招好用)
    
    比如，你想尝试三种不同的 AI 编码方案，可以创建三个 Worktrees：
    
    ```bash
    git worktree add -b variant1 ../my-project-variant1
    git worktree add -b variant2 ../my-project-variant2
    git worktree add -b variant3 ../my-project-variant3
    ```
    
2.  **启动多个 Cursor 实例：** 在每个 Worktree 目录下，分别启动 Cursor 编辑器。比如：
    
    ```bash
    cursor ../my-project-variant1
    cursor ../my-project-variant2
    cursor ../my-project-variant3
    ```
    
    现在，你就有三个独立的 Cursor 窗口，每个窗口都对应一个 Worktree 和分支。
    
3.  **给 Composer 分配任务：** 在每个 Cursor 窗口中，启动 Composer (Chat 模式或者 Agent 模式)，让它负责特定的任务或者尝试不同的解决方案。用 `@` 符号给 Composer 提供上下文信息 (文件、目录、文档)，让它更精准地理解你的意图。
    
    比如，在 `variant1` Worktree 中，你可以让 Composer 尝试用 “方案 A” 来优化某个函数；在 `variant2` Worktree 中，让它尝试 “方案 B”；在 `variant3` Worktree 中，让它尝试 “方案 C”。
    
4.  **监控和迭代：** 时不时地看看每个 Composer 实例的进度。因为它们在不同的 Worktrees 中工作，所以完全不会有冲突，你可以安心地并行开发。
    
5.  **合并最佳方案：** 当某个分支的方案效果最好时，用 `git merge <branch-name>` 把它合并回你的主分支。
    
6.  **清理 Worktrees：** 用完的 Worktrees 可以用这行命令删除：
    
    ```bash
    git worktree remove ../<project-name>-<branch-name>
    ```
    

**ZSH 函数：让效率更上一层楼 (可选但超神)**

为了让这个流程更自动化，文章还贴心地提供了两个 ZSH 函数 (如果你用的是 Bash 或者 Fish，可以自己改改)：

*   `wtree()`: 这个函数可以接受多个分支名作为参数，自动创建对应的 Worktrees，安装依赖 (用 `-p` 标志可以指定 PNPM)，还可以选择在每个 Worktree 中启动 Cursor。简直是懒人福音！
*   `wtmerge()`: 这个函数接受一个分支名作为参数，把指定分支合并到主分支，然后清理掉 `wtree()` 创建的所有 Worktrees。一键合并 + 清理，强迫症患者狂喜！

```bash
# wtree: Create a new worktree for each given branch.
# Usage: wtree [ -p|--pnpm ] branch1 branch2 ...
#
# This function does the following:
#   1. Parses command-line arguments; if -p/--pnpm is provided, it will later run "pnpm install".
#   2. Determines the current branch and repository root.
#   3. Uses a fixed parent directory (~/dev) to house all worktree directories.
#   4. For each branch passed:
#        - If the branch does not exist, it is created from the current branch.
#        - It checks that a worktree for that branch does not already exist.
#        - It then creates a worktree in ~/dev using a naming convention: <repoName>-<branch>.
#        - If the install-deps flag is true, it runs "pnpm install" inside the new worktree.
#        - Finally, it either opens the new worktree via the custom "cursor" command (if defined)
#          or prints its path.
wtree() {
  # Flag to determine whether to run "pnpm install"
  local install_deps=false
  local branches=()

  # Parse command-line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -p|--pnpm)
        install_deps=true
        shift
        ;;
      *)
        branches+=("$1")
        shift
        ;;
    esac
  done

  # Ensure at least one branch name is provided.
  if [[ ${#branches[@]} -eq 0 ]]; then
    echo "Usage: wtree [ -p|--pnpm ] branch1 branch2 ..."
    return 1
  fi

  # Determine the current branch; exit if not in a git repository.
  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD) || {
    echo "Error: Not a git repository."
    return 1
  }

  # Determine repository root and name.
  local repo_root repo_name
  repo_root=$(git rev-parse --show-toplevel) || {
    echo "Error: Cannot determine repository root."
    return 1
  }
  repo_name=$(basename "$repo_root")

  # Set fixed parent directory for worktrees.
  local worktree_parent="$HOME/dev"
  # Ensure the worktree parent directory exists.
  if [[ ! -d "$worktree_parent" ]]; then
    if ! mkdir -p "$worktree_parent"; then
      echo "Error: Failed to create worktree parent directory: $worktree_parent"
      return 1
    fi
  fi

  # Loop over each branch provided as argument.
  for branch in "${branches[@]}"; do
    # Define the target path using a naming convention: <repoName>-<branch>
    local target_path="$worktree_parent/${repo_name}-${branch}"
    
    echo "Processing branch: ${branch}"

    # Check if a worktree already exists at the target path.
    if git worktree list | grep -q "^${target_path}[[:space:]]"; then
      echo "Error: Worktree already exists at ${target_path}. Skipping branch '${branch}'."
      continue
    fi

    # If the branch does not exist, create it from the current branch.
    if ! git show-ref --verify --quiet "refs/heads/${branch}"; then
      echo "Branch '${branch}' does not exist. Creating it from '${current_branch}'..."
      if ! git branch "${branch}"; then
        echo "Error: Failed to create branch '${branch}'. Skipping."
        continue
      fi
    fi

    # Create the new worktree for the branch.
    echo "Creating worktree for branch '${branch}' at ${target_path}..."
    if ! git worktree add "$target_path" "${branch}"; then
      echo "Error: Failed to create worktree for branch '${branch}'. Skipping."
      continue
    fi

    # If the install flag is set, run "pnpm install" in the new worktree.
    if $install_deps; then
      echo "Installing dependencies in worktree for branch '${branch}'..."
      if ! ( cd "$target_path" && pnpm install ); then
        echo "Warning: Failed to install dependencies in '${target_path}'."
      fi
    fi

    # Optionally, open the worktree directory via a custom "cursor" command if available.
    if type cursor >/dev/null 2>&1; then
      cursor "$target_path"
    else
      echo "Worktree created at: ${target_path}"
    fi

    echo "Worktree for branch '${branch}' created successfully."
    echo "-----------------------------------------------------"
  done
}


# wtmerge: Merge changes from a specified worktree branch into main,
# then clean up all worktrees and delete their branches.
#
# Usage: wtmerge <branch-to-keep>
#
# This function does the following:
#   1. Verifies that the branch to merge (branch-to-keep) exists as an active worktree.
#   2. Checks for uncommitted changes in that worktree:
#        - If changes exist, it attempts to stage and commit them.
#        - It gracefully handles the situation where there are no changes.
#   3. Switches the current (main) worktree to the "main" branch.
#   4. Merges the specified branch into main, with proper error checking.
#   5. Uses "git worktree list" to retrieve all active worktrees (under ~/dev
#      and matching the naming pattern) and removes them.
#   6. Deletes each branch that was created for a worktree (skipping "main").
wtmerge() {
  # Ensure exactly one argument is passed: the branch to merge.
  if [ $# -ne 1 ]; then
    echo "Usage: wtmerge <branch-to-keep>"
    return 1
  fi

  local branch_to_keep="$1"

  # Determine the repository root and its name.
  local repo_root repo_name
  repo_root=$(git rev-parse --show-toplevel) || {
    echo "Error: Not a git repository."
    return 1
  }
  repo_name=$(basename "$repo_root")

  # Fixed parent directory where worktrees are located.
  local worktree_parent="$HOME/dev"

  # Retrieve all active worktrees (from git worktree list) that match our naming convention.
  local worktrees=()
  while IFS= read -r line; do
    # Extract the worktree path (first field)
    local wt_path
    wt_path=$(echo "$line" | awk '{print $1}')
    # Only consider worktrees under our fixed parent directory that match "<repo_name>-*"
    if [[ "$wt_path" == "$worktree_parent/${repo_name}-"* ]]; then
      worktrees+=("$wt_path")
    fi
  done < <(git worktree list)

  # Check that the target branch worktree exists.
  local target_worktree=""
  for wt in "${worktrees[@]}"; do
    if [[ "$wt" == "$worktree_parent/${repo_name}-${branch_to_keep}" ]]; then
      target_worktree="$wt"
      break
    fi
  done

  if [[ -z "$target_worktree" ]]; then
    echo "Error: No active worktree found for branch '${branch_to_keep}' under ${worktree_parent}."
    return 1
  fi

  # Step 1: In the target worktree, check for uncommitted changes.
  echo "Checking for uncommitted changes in worktree for branch '${branch_to_keep}'..."
  if ! ( cd "$target_worktree" && git diff --quiet && git diff --cached --quiet ); then
    echo "Changes detected in branch '${branch_to_keep}'. Attempting auto-commit..."
    if ! ( cd "$target_worktree" &&
            git add . &&
            git commit -m "chore: auto-commit changes in '${branch_to_keep}' before merge" ); then
      echo "Error: Auto-commit failed in branch '${branch_to_keep}'. Aborting merge."
      return 1
    else
      echo "Auto-commit successful in branch '${branch_to_keep}'."
    fi
  else
    echo "No uncommitted changes found in branch '${branch_to_keep}'."
  fi

  # Step 2: Switch to the main worktree (assumed to be the current directory) and check out main.
  echo "Switching to 'main' branch in the main worktree..."
  if ! git checkout main; then
    echo "Error: Failed to switch to 'main' branch."
    return 1
  fi

  # Step 3: Merge the target branch into main.
  echo "Merging branch '${branch_to_keep}' into 'main'..."
  if ! git merge "${branch_to_keep}" -m "feat: merge changes from '${branch_to_keep}'"; then
    echo "Error: Merge failed. Please resolve conflicts and try again."
    return 1
  fi

  # Step 4: Remove all worktrees that were created via wtree().
  echo "Cleaning up worktrees and deleting temporary branches..."
  for wt in "${worktrees[@]}"; do
    # Extract branch name from worktree path.
    local wt_branch
    wt_branch=$(basename "$wt")
    wt_branch=${wt_branch#${repo_name}-}  # Remove the repo name prefix

    echo "Processing worktree for branch '${wt_branch}' at ${wt}..."
    # Remove the worktree using --force to ensure removal.
    if git worktree remove "$wt" --force; then
      echo "Worktree at ${wt} removed."
    else
      echo "Warning: Failed to remove worktree at ${wt}."
    fi

    # Do not delete the 'main' branch.
    if [[ "$wt_branch" != "main" ]]; then
      if git branch -D "$wt_branch"; then
        echo "Branch '${wt_branch}' deleted."
      else
        echo "Warning: Failed to delete branch '${wt_branch}'."
      fi
    fi
  done

  echo "Merge complete: Branch '${branch_to_keep}' merged into 'main', and all worktrees cleaned up."
}
```

**用了 Worktrees，有什么好处？**

*   **并行开发，速度飞起：** 同时运行多个 Composer 实例，开发速度直接翻倍。
*   **告别冲突，安心实验：** 在独立的 Worktrees 中尝试不同的方案，再也不用担心代码冲突了。
*   **快速迭代，效率爆棚：** 快速创建、测试、合并 (或者丢弃) 代码变体，加速你的迭代周期。
*   **工作区整洁如新：** Worktrees 把你的主项目目录保持得干干净净，再也不用被各种分支搞得眼花缭乱了。

**总结：**

还在苦苦等待单个 AI 编码助手慢慢吞吞地干活？还在被代码冲突搞得焦头烂额？赶紧用上 Git Worktrees + Cursor Composer 这套组合拳吧！它能让你真正释放 AI 编码助手的潜力，让你的开发效率像坐火箭一样飞升。

用了 Worktrees，你会发现，原来并行宇宙真的存在，而且就在你的代码编辑器里。

现在就去试试吧，保证让你爽到飞起！
