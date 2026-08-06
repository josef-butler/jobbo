.PHONY: solve dev install

solve:
	@python solver/solver.py

dev:
	@cd apps/web && pnpm dev

install:
	@pip install -r solver/requirements.txt
	@cd apps/web && pnpm install
