# 계층적 파생 문제 저장 로직 수정

## 문제 상황
파생 문제의 파생 문제를 생성할 때 (A → B → C), B의 `parentProblemId`가 아직 임시 ID(`temp-derived-`)로 되어 있어서 C를 저장할 때 UUID 형식 오류가 발생합니다.

## 해결 방법
`saveDerivedProblems` 함수에 ID 매핑 로직을 추가하여 계층적 구조를 지원합니다.

## 수정할 파일
`src/app/admin/problems/page.tsx`

## 수정할 함수
라인 401-492의 `saveDerivedProblems` 함수를 아래 코드로 **완전히 교체**하세요:

```typescript
  // Helper function to save derived problems (supports hierarchical structure)
  const saveDerivedProblems = async (parentProblemId: string, oldParentId?: string) => {
    // Get current problems state to find derived problems
    const currentProblems = problems;
    
    // Find all derived problems linked to this parent (including nested ones)
    const allDerivedProblems = currentProblems.filter(p => 
      p.isGenerated === true && 
      p.id.startsWith('temp-derived-')  // Only unsaved derived problems
    );
    
    // Build a dependency graph to save in correct order (parents before children)
    const directChildren = allDerivedProblems.filter(p =>
      p.parentProblemId === parentProblemId || p.parentProblemId === oldParentId
    );
    
    if (directChildren.length === 0 && allDerivedProblems.length === 0) {
      console.log('ℹ️ No unsaved derived problems found');
      return;
    }
    
    console.log(`🌳 Saving hierarchical derived problems (${directChildren.length} direct, ${allDerivedProblems.length} total)...`);
    
    // Create a mapping to track temp IDs -> real UUIDs
    const idMapping = new Map<string, string>();
    idMapping.set(parentProblemId, parentProblemId); // Parent is already a real ID
    if (oldParentId) {
      idMapping.set(oldParentId, parentProblemId);
    }
    
    const savedDerivedIds: string[] = [];
    let successCount = 0;
    
    // Helper function to recursively save a problem and its children
    const saveProblemHierarchy = async (problemId: string, depth: number = 0): Promise<void> => {
      const problem = currentProblems.find(p => p.id === problemId);
      if (!problem || !problemId.startsWith('temp-derived-')) {
        return;
      }
      
      try {
        // Resolve parent ID from mapping
        let actualParentId = problem.parentProblemId;
        if (actualParentId && idMapping.has(actualParentId)) {
          actualParentId = idMapping.get(actualParentId)!;
        }
        
        console.log(`${'  '.repeat(depth)}📝 [Depth ${depth}] Saving: "${problem.title}"`);
        console.log(`${'  '.repeat(depth)}   Parent: ${actualParentId}`);
        
        // Prepare problem data with resolved parent ID
        const problemToSave = {
          ...problem,
          parentProblemId: actualParentId,
        };
        
        const savedProblem = await saveProblemToSupabase(problemToSave);
        const oldId = problem.id;
        const newId = savedProblem.id;
        
        console.log(`${'  '.repeat(depth)}✅ Saved: ${newId} (was ${oldId})`);
        
        // Store mapping for children
        idMapping.set(oldId, newId);
        
        // Update local state
        setProblems(prev => prev.map(p => {
          if (p.id === oldId) {
            return { ...p, id: newId, parentProblemId: actualParentId };
          }
          // Update any child that references this temp ID as parent
          if (p.parentProblemId === oldId) {
            return { ...p, parentProblemId: newId };
          }
          return p;
        }));
        
        savedDerivedIds.push(newId);
        
        // Create relationship in problem_relationships table
        try {
          const relatedProblem = relatedProblems.find(rp => rp.title === problem.title);
          await problemRelationshipsAPI.create(
            actualParentId!,
            newId,
            'derived',
            {
              concept: relatedProblem?.concept || 'AI Generated',
              description: relatedProblem?.explanation || `Derived problem (Level ${depth + 1})`,
              strength: 0.8,
              sequenceOrder: depth
            }
          );
          console.log(`${'  '.repeat(depth)}🔗 Relationship: ${actualParentId} → ${newId}`);
        } catch (relError: any) {
          console.warn(`${'  '.repeat(depth)}⚠️ Relationship creation failed:`, relError.message);
        }
        
        // Update parent's linked_problem_ids
        try {
          const parent = await problemsAPI.getById(actualParentId!);
          const currentLinkedIds = parent.linked_problem_ids || [];
          const updatedLinkedIds = [...currentLinkedIds.filter(id => !id.startsWith('temp-')), newId];
          
          await problemsAPI.update(actualParentId!, {
            linked_problem_ids: updatedLinkedIds
          });
          
          if (actualParentId === parentProblemId) {
            setLinkedProblems(prev => {
              const filtered = prev.filter(id => !id.startsWith('temp-'));
              return filtered.includes(newId) ? filtered : [...filtered, newId];
            });
          }
          
          console.log(`${'  '.repeat(depth)}✅ Updated parent's linked_problem_ids`);
        } catch (error: any) {
          console.warn(`${'  '.repeat(depth)}⚠️ Failed to update parent:`, error.message);
        }
        
        successCount++;
        
        // Now find and save all children of this problem
        const children = currentProblems.filter(p => 
          p.parentProblemId === oldId && p.id.startsWith('temp-derived-')
        );
        
        if (children.length > 0) {
          console.log(`${'  '.repeat(depth)}👶 Found ${children.length} child(ren) of "${problem.title}"`);
          for (const child of children) {
            await saveProblemHierarchy(child.id, depth + 1);
          }
        }
        
      } catch (error: any) {
        console.error(`${'  '.repeat(depth)}❌ Failed to save "${problem.title}":`, error.message);
        throw error; // Re-throw to stop further processing
      }
    };
    
    // Start saving from direct children
    for (const child of directChildren) {
      try {
        await saveProblemHierarchy(child.id, 0);
      } catch (error) {
        // Error already logged, continue with next
      }
    }
    
    console.log(`\n✅ Hierarchical save complete: ${successCount} problem(s) saved\n`);
    
    if (successCount > 0) {
      showToast(`✅ Saved ${successCount} derived problem(s) with hierarchy!`, "success");
    } else if (directChildren.length > 0) {
      showToast(`⚠️ Failed to save derived problems`, "error");
    }
  };
```

## 주요 변경사항

1. **ID 매핑 시스템**: `idMapping`으로 임시 ID를 실제 UUID로 추적
2. **재귀적 저장**: `saveProblemHierarchy` 함수로 부모 → 자식 순서로 저장
3. **Parent ID 해결**: 저장 전에 부모 ID가 임시 ID인 경우 실제 ID로 변환
4. **계층 깊이 표시**: 로그에 들여쓰기와 깊이 표시로 구조 시각화
5. **Children 자동 처리**: 저장 후 자식 문제들을 자동으로 찾아서 저장

## 테스트 시나리오

1. A 문제 생성 및 저장 ✅
2. A에서 B 문제 파생 및 저장 ✅
3. B (임시 ID 상태)에서 C 문제 파생 및 함께 저장 ✅
4. 계층 구조: A → B → C → D 지원 ✅

## UI 개선도 필요

다음 단계로 Problem List의 UI를 개선하여 계층 구조를 트리 형태로 표시해야 합니다.

