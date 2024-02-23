FROM python:3.13.0a4

# install poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="$PATH:/root/.local/bin"
RUN poetry config virtualenvs.create false

# install madara swap
WORKDIR /app/starksheet/packages/starksheet-cairo
COPY poetry.lock .
COPY pyproject.toml .
COPY scripts ./scripts
COPY README.md .
RUN poetry install
# split install in two steps to leverage docker cache
COPY . .
RUN poetry install

# Build contracts
RUN python scripts/compile_starksheet.py

# Deploy madara swap
CMD ["python", "scripts/deploy_starksheet.py"]
