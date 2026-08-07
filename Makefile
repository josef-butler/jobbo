.PHONY: solve dev install compare

solve:
	@python solver/solver.py

compare:
	@python solver/compare.py

dev:
	@cd apps/web && pnpm dev

install:
	@pip install -r solver/requirements.txt
	@cd apps/web && pnpm install
