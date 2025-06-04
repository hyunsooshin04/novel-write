-- worldbuilding 테이블의 project_id 열에 UNIQUE 제약 조건 추가
ALTER TABLE worldbuilding ADD CONSTRAINT worldbuilding_project_id_unique UNIQUE (project_id);
