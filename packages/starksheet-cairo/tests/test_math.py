import pytest


@pytest.mark.asyncio
class TestMath:
    class TestDiv:
        @staticmethod
        async def test_should_return_correct_integer(math):
            q = (await math.div([8328840, 69]).call()).result
            assert q.res == 8328840 // 69
